# backend/bookings/views.py
import logging
import jdatetime

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Booking, Service
from .serializers import BookingSerializer, BookingListSerializer, ServiceSerializer
from .services import (
    make_booking,
    SlotTaken,
    OutsideWorkingHours,
    WorkingHoursNotConfigured,
    cancel_booking_by_customer,
    BookingModificationWindowClosed,
    BookingOwnershipMismatch,
)

logger = logging.getLogger(__name__)


class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """
    Permission: POST/PATCH/DELETE only for owner/admin, GET for all.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user:
            return False

        salon = getattr(user, "salon", None)
        if salon and getattr(salon, "id", None) == getattr(obj, "salon_id", None):
            return True
        return False


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        salon_id = self.kwargs.get("salon_id")
        logger.debug("BookingListCreateView: fetching bookings for salon_id=%s", salon_id)
        qs = Booking.objects.filter(salon_id=salon_id)

        user = getattr(self.request, "user", None)
        if user and user.is_authenticated:
            user_role = getattr(user, "role", "customer")

            if user_role in ["owner", "staff"]:
                user_salon = getattr(user, "salon", None)
                if user_salon and user_salon.id == int(salon_id):
                    return qs.order_by("-created_at")
                else:
                    logger.warning(
                        "Unauthorized salon access: user=%s tried to access salon=%s",
                        user.username,
                        salon_id,
                    )
                    qs = qs.none()
            else:
                phone = getattr(user, "phone_number", None)
                username = getattr(user, "username", None)

                if phone:
                    qs = qs.filter(customer_phone=phone)
                    logger.debug(
                        "BookingListCreateView: filtered bookings for customer %s with phone %s",
                        username,
                        phone,
                    )
                else:
                    logger.warning("Customer %s has no phone number to filter bookings", username)
                    qs = qs.none()

            return qs.order_by("-created_at")

        customer_phone = self.request.GET.get("customer_phone") or self.request.GET.get("phone")
        if customer_phone:
            qs = qs.filter(customer_phone=customer_phone)

        return qs.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        salon_id = self.kwargs.get("salon_id")
        logger.info(
            "Booking creation request for salon_id=%s, user=%s",
            salon_id,
            request.user.username if request.user else "anonymous",
        )

        from shops.models import Salon
        try:
            salon = Salon.objects.get(pk=salon_id)
        except Salon.DoesNotExist:
            logger.warning("Booking creation: salon_id=%s not found", salon_id)
            return Response({"message": "سالن یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        if salon.is_currently_disabled():
            disable_message = "سالن در حال حاضر غیرفعال است"
            if salon.disabled_until:
                from django.utils.formats import date_format
                disable_until = date_format(salon.disabled_until, "SHORT_DATE_FORMAT")
                disable_message += f" تا {disable_until}"
            if salon.disable_reason:
                disable_message += f". دلیل: {salon.disable_reason}"
            logger.warning("Booking creation: salon_id=%s is currently disabled", salon_id)
            return Response({"message": disable_message}, status=status.HTTP_403_FORBIDDEN)
        
        
        user = request.user
        try:
            user_city = (getattr(user, 'city', '') or '').strip().lower()
            salon_city = (salon.city or '').strip().lower()
            if user and getattr(user, 'is_authenticated', False) and user_city and salon_city and user_city != salon_city:
                return Response({"message": "این سالن متعلق به شهر دیگری است و امکان رزرو از شهر شما وجود ندارد."}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            # در صورت بروز هر خطا، اجازه ادامه بده — لاگ شود
            logger.exception("Error comparing user and salon city during booking check")

        data = request.data
        service_id = data.get("service_id")
        service_ids = data.get("service_ids")
        start_at_raw = data.get("start_at")
        meta = data.get("meta", {})

        user = request.user
        name = (
            getattr(user, "get_full_name", lambda: "")()
            or getattr(user, "first_name", "")
            or getattr(user, "username", "")
        )
        phone = getattr(user, "phone_number", None) or getattr(user, "phone", None) or ""
        email = getattr(user, "email", "") or ""

        logger.debug(
            "Booking data: service_id=%s, service_ids=%s, start_at=%s, user=%s, phone=%s, email=%s",
            service_id,
            service_ids,
            start_at_raw,
            user.username,
            phone,
            email,
        )

        if not start_at_raw or (not service_id and not service_ids):
            missing = []
            if not start_at_raw:
                missing.append("start_at")
            if not service_id and not service_ids:
                missing.append("service_id or service_ids")
            logger.warning("Booking creation: missing required fields for salon_id=%s: %s", salon_id, missing)
            return Response({"message": f"missing fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

        if not phone:
            logger.warning("Booking creation: user %s has no phone number", user.username)
            return Response(
                {"message": "شماره تلفن در پروفایل شما ثبت نشده است. لطفاً ابتدا پروفایل خود را کامل کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if service_ids:
            if not isinstance(service_ids, list) or len(service_ids) == 0:
                return Response({"message": "service_ids must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)
            services_qs = Service.objects.filter(pk__in=service_ids, salon_id=salon_id)
            if services_qs.count() != len(service_ids):
                logger.warning("Booking creation: one or more service_ids not found for salon_id=%s", salon_id)
                return Response({"message": "one or more services not found"}, status=status.HTTP_404_NOT_FOUND)
            if services_qs.filter(is_active=False).exists():
                return Response({"message": "one or more services not available"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                service = Service.objects.get(pk=service_id, salon_id=salon_id)
            except Service.DoesNotExist:
                logger.warning("Booking creation: service_id=%s not found for salon_id=%s", service_id, salon_id)
                return Response({"message": "service not found"}, status=status.HTTP_404_NOT_FOUND)
            if not service.is_active:
                logger.warning("Booking creation: attempted to book inactive service_id=%s", service_id)
                return Response({"message": "This service is not available"}, status=status.HTTP_400_BAD_REQUEST)

        start_at = parse_datetime(start_at_raw)
        if start_at is None:
            logger.warning("Booking creation: invalid start_at format '%s'", start_at_raw)
            return Response({"message": "invalid start_at format"}, status=status.HTTP_400_BAD_REQUEST)

        if start_at.tzinfo is None:
            start_at = timezone.make_aware(start_at, timezone=timezone.utc)

        try:
            if service_ids:
                booking = make_booking(
                    salon_id=salon_id,
                    service_ids=service_ids,
                    start_at=start_at,
                    customer_name=name,
                    customer_phone=phone,
                    customer_email=email,
                    meta=meta,
                )
            else:
                booking = make_booking(
                    salon_id=salon_id,
                    service_id=service_id,
                    start_at=start_at,
                    customer_name=name,
                    customer_phone=phone,
                    customer_email=email,
                    meta=meta,
                )

            logger.info("Booking created successfully: booking_id=%s, salon_id=%s", booking.id, salon_id)
            serializer = BookingListSerializer(booking)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except SlotTaken:
            logger.warning("Booking creation: slot taken for salon_id=%s, start_at=%s", salon_id, start_at)
            return Response(
                {"message": "این نوبت قبلاً توسط شخص دیگری رزرو شده است"},
                status=status.HTTP_409_CONFLICT,
            )
        except OutsideWorkingHours as e:
            logger.warning("Booking creation: outside working hours for salon_id=%s, start_at=%s", salon_id, start_at)
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except WorkingHoursNotConfigured:
            logger.warning("Booking creation: working hours not configured for salon_id=%s", salon_id)
            return Response({"message": "ساعات کاری سالن تعریف نشده است"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Error creating booking for salon_id=%s: %s", salon_id, str(e))
            return Response({"message": "internal error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Service.objects.filter(is_active=True).order_by("id")

    def perform_create(self, serializer):
        logger.info(
            "Service creation: user=%s, data=%s",
            self.request.user.username if self.request.user else "anonymous",
            serializer.validated_data,
        )
        user = self.request.user
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required to create service")
        if getattr(user, "role", None) not in ["owner", "staff"] or not getattr(user, "salon", None):
            raise PermissionDenied("Only salon owners or staff can create services")
        serializer.save(salon=user.salon)


class ServiceRetrieveUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self):
        obj = super().get_object()
        logger.debug("ServiceRetrieveUpdateView: accessing service_id=%s, salon_id=%s", obj.id, obj.salon_id)

        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            user = self.request.user
            if not user or not user.is_authenticated:
                raise PermissionDenied("Authentication required")
            if getattr(user, "role", None) not in ["owner", "staff"] or not getattr(user, "salon", None):
                raise PermissionDenied("Only salon owner or staff can modify services")
            if obj.salon_id != user.salon.id:
                raise PermissionDenied("Cannot modify services of another salon")
        return obj

    def perform_update(self, serializer):
        logger.info(
            "Service update: service_id=%s, user=%s",
            self.get_object().id,
            self.request.user.username if self.request.user else "anonymous",
        )
        serializer.save()

    def delete(self, request, *args, **kwargs):
        user = request.user
        if not user or not user.is_authenticated or getattr(user, "role", None) not in ["owner", "staff"] or not getattr(user, "salon", None):
            raise PermissionDenied("Only salon owner or staff can delete services")

        service = self.get_object()
        if service.salon_id != user.salon.id:
            raise PermissionDenied("Cannot delete services of another salon")

        active_bookings = Booking.objects.filter(service_id=service.id, status="pending").count()
        if active_bookings > 0:
            logger.warning(
                "Service deletion blocked: service_id=%s has %d active bookings",
                service.id,
                active_bookings,
            )
            return Response(
                {"message": f"Cannot delete service with {active_bookings} active bookings"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info("Service soft deleted: service_id=%s, salon_id=%s", service.id, service.salon_id)
        service.is_active = False
        service.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookingActionAPIView(APIView):
    """
    POST /api/tenants/{salon_id}/bookings/{booking_id}/{action}/
    action:
      - owner/staff: confirm | cancel
      - customer: cancel
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, salon_id, booking_id, action, *args, **kwargs):
        user = request.user
        action = str(action).lower()

        try:
            booking = Booking.objects.get(pk=booking_id, salon_id=salon_id)
        except Booking.DoesNotExist:
            return Response({"detail": "booking not found"}, status=status.HTTP_404_NOT_FOUND)

        role = getattr(user, "role", None)

        if role in ["owner", "staff"]:
            if not getattr(user, "salon", None) or int(user.salon.id) != int(salon_id):
                return Response({"detail": "cannot manage bookings of another salon"}, status=status.HTTP_403_FORBIDDEN)

            if action == "confirm":
                booking.status = "confirmed"
                booking.save(update_fields=["status"])
                return Response(BookingListSerializer(booking).data, status=status.HTTP_200_OK)

            if action == "cancel":
                booking.status = "cancelled"
                booking.save(update_fields=["status"])
                return Response(BookingListSerializer(booking).data, status=status.HTTP_200_OK)

            return Response({"detail": "invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        if role == "customer":
            phone = getattr(user, "phone_number", None)
            username = getattr(user, "username", None)

            if phone and booking.customer_phone != phone and booking.customer_name != username:
                return Response({"detail": "permission denied"}, status=status.HTTP_403_FORBIDDEN)

            if action == "cancel":
                try:
                    booking = cancel_booking_by_customer(
                        booking,
                        customer_phone=phone,
                        customer_name=username,
                    )
                except BookingModificationWindowClosed as e:
                    return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
                except BookingOwnershipMismatch:
                    return Response({"detail": "permission denied"}, status=status.HTTP_403_FORBIDDEN)

                return Response(BookingListSerializer(booking).data, status=status.HTTP_200_OK)

            return Response({"detail": "invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "permission denied"}, status=status.HTTP_403_FORBIDDEN)


class CustomerBookingsView(generics.ListAPIView):
    """
    API view for authenticated customers to see all their bookings across all salons.
    Filters by phone number (if set) OR by customer name matching username.
    """
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q

        user = self.request.user
        user_role = getattr(user, "role", "customer")
        if user_role not in ["customer"]:
            logger.warning("Non-customer user %s tried to access customer bookings view", user.username)
            return Booking.objects.none()

        phone = getattr(user, "phone_number", None)
        username = getattr(user, "username", None)

        query = Q()

        if phone:
            query |= Q(customer_phone=phone)
            logger.debug("CustomerBookingsView: added phone filter for customer %s with phone %s", username, phone)

        if username:
            query |= Q(customer_name=username)
            logger.debug("CustomerBookingsView: added username filter for customer %s", username)

        if not query:
            logger.warning("Customer %s has no phone number or username to filter by", username)
            return Booking.objects.none()

        qs = Booking.objects.filter(query)
        logger.debug("CustomerBookingsView: fetching bookings for customer %s, found %d bookings", username, qs.count())
        return qs.order_by("-created_at")


class DayOfWeekCalculatorView(APIView):
    """
    API view to calculate day of week for Persian dates.
    POST /api/bookings/calculate-day-of-week/
    """

    def post(self, request, *args, **kwargs):
        dates = request.data.get("dates", [])

        if not isinstance(dates, list) or len(dates) == 0:
            return Response(
                {"error": "Please provide a list of dates in format YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = {}
        day_names = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]

        logger.info(f"Calculating day of week for {len(dates)} dates")

        for date_str in dates:
            try:
                parts = date_str.split("-")
                if len(parts) != 3:
                    logger.warning(f"Invalid date format: {date_str}")
                    continue

                py, pm, pd = int(parts[0]), int(parts[1]), int(parts[2])

                jdate = jdatetime.date(py, pm, pd)
                gdate = jdate.togregorian()

                python_weekday = gdate.weekday()
                our_weekday = (python_weekday + 2) % 7
                day_name = day_names[our_weekday]

                logger.info(
                    f"{date_str}: Gregorian={gdate}, python_weekday={python_weekday}, our_weekday={our_weekday} ({day_name})"
                )

                result[date_str] = {
                    "day_of_week": our_weekday,
                    "day_name": day_name,
                }
            except Exception as e:
                logger.error(f"Error calculating day of week for {date_str}: {e}")
                continue

        return Response(result, status=status.HTTP_200_OK)