from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, serializers, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied

from django.db.models import Q
from django.db import connection, IntegrityError
from django.utils import timezone
from decimal import Decimal

from .models import Salon, Service, SalonWorkingHours, Review, PortfolioCategory, PortfolioItem
from .serializers import (
    SalonSerializer, ServiceSerializer, SalonWorkingHoursSerializer,
    ReviewSerializer, PortfolioCategorySerializer, PortfolioItemSerializer
)
from bookings.models import Booking

import logging
from decimal import InvalidOperation

class ServiceManageViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'salon') and user.salon:
            return Service.objects.filter(salon=user.salon)
        return Service.objects.none()

    def _has_valid_price(self, price):
        if price in (None, ''):
            return False
        try:
            return Decimal(str(price)) > 0
        except Exception:
            return False

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'salon') and user.salon:
            price = serializer.validated_data.get('price')
            if not self._has_valid_price(price):
                raise serializers.ValidationError({'price': 'قیمت این سرویس باید بیشتر از صفر باشد'})
            try:
                serializer.save(salon=user.salon)
            except IntegrityError:
                raise serializers.ValidationError({'name': 'خدمتی با این نام قبلاً ثبت شده است'})
        else:
            raise serializers.ValidationError('شما سالن ندارید')

    def perform_update(self, serializer):
        user = self.request.user
        if hasattr(user, 'salon') and user.salon:
            service = self.get_object()
            if service.salon != user.salon:
                raise serializers.ValidationError('شما اجازه تغییر این سرویس را ندارید')

            updated_price = serializer.validated_data.get('price', service.price)
            is_becoming_active = serializer.validated_data.get('is_active', service.is_active)
            if is_becoming_active and not self._has_valid_price(updated_price):
                raise serializers.ValidationError({'price': 'قیمت این سرویس را قبل از فعال‌سازی مشخص کنید'})
            try:
                serializer.save()
            except IntegrityError:
                raise serializers.ValidationError({'name': 'خدمتی با این نام قبلاً ثبت شده است'})
        else:
            raise serializers.ValidationError('شما سالن ندارید')

    def perform_destroy(self, instance):
        user = self.request.user
        if hasattr(user, 'salon') and user.salon:
            if instance.salon != user.salon:
                raise serializers.ValidationError('شما اجازه حذف این سرویس را ندارید')
            instance.is_active = False
            instance.save()
        else:
            raise serializers.ValidationError('شما سالن ندارید')

# ViewSet برای مدیریت سرویس‌ها توسط صاحب آرایشگاه.
class ServiceManagementViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'owner' and self.request.user.salon:
            return self.queryset.filter(salon=self.request.user.salon)
        return self.queryset.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'owner' and self.request.user.salon:
            serializer.save(salon=self.request.user.salon)


# ViewSet برای مدیریت ساعات کاری سالن
class SalonWorkingHoursViewSet(viewsets.ModelViewSet):
    serializer_class = SalonWorkingHoursSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'owner' and self.request.user.salon:
            return SalonWorkingHours.objects.filter(
                salon=self.request.user.salon
            ).order_by('day_of_week', 'sort_order', 'start_time')
        return SalonWorkingHours.objects.none()

    def _get_owner_salon(self):
        user = self.request.user
        if user.role != 'owner' or not getattr(user, 'salon', None):
            raise PermissionDenied('شما اجازه افزودن ساعات کاری ندارید')
        return user.salon

    def _next_sort_order(self, salon, day_of_week):
        last_item = (
            SalonWorkingHours.objects.filter(salon=salon, day_of_week=day_of_week)
            .order_by('-sort_order', '-start_time')
            .first()
        )
        if not last_item:
            return 0
        try:
            return int(last_item.sort_order) + 1
        except Exception:
            return 0

    def _create_one(self, salon, day_of_week, start_time, end_time, sort_order=None):
        payload = {
            'day_of_week': day_of_week,
            'start_time': start_time,
            'end_time': end_time,
            'sort_order': self._next_sort_order(salon, day_of_week) if sort_order is None else sort_order,
        }
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        return serializer.save(salon=salon)

    def create(self, request, *args, **kwargs):
        """
        Supports both payload styles:

        1) single record:
           { day_of_week, start_time, end_time, sort_order? }

        2) batch from the new UI:
           { selectedDays: [...], shifts: [{start_time, end_time, sort_order?}, ...] }

        For batch requests, one row is created per day × shift.
        Duplicate rows are skipped instead of returning 400.
        """
        salon = self._get_owner_salon()
        data = request.data

        selected_days = data.get('selectedDays')
        shifts = data.get('shifts')

        if isinstance(selected_days, (list, tuple)) and isinstance(shifts, (list, tuple)):
            created = []
            skipped = []
            errors = []

            for day in selected_days:
                try:
                    day_int = int(day)
                except (TypeError, ValueError):
                    errors.append({'day_of_week': f'روز نامعتبر: {day}'})
                    continue

                for shift in shifts:
                    if not isinstance(shift, dict):
                        errors.append({'shifts': 'ساختار شیفت نامعتبر است'})
                        continue

                    start_time = shift.get('start_time')
                    end_time = shift.get('end_time')
                    sort_order = shift.get('sort_order')

                    if not start_time or not end_time:
                        errors.append({
                            'day_of_week': day_int,
                            'start_time': 'این فیلد الزامی است',
                            'end_time': 'این فیلد الزامی است',
                        })
                        continue

                    if str(start_time) >= str(end_time):
                        errors.append({
                            'day_of_week': day_int,
                            'end_time': 'زمان پایان باید بعد از زمان شروع باشد',
                        })
                        continue

                    if SalonWorkingHours.objects.filter(
                        salon=salon,
                        day_of_week=day_int,
                        start_time=start_time,
                        end_time=end_time,
                    ).exists():
                        skipped.append({
                            'day_of_week': day_int,
                            'start_time': start_time,
                            'end_time': end_time,
                        })
                        continue

                    created_obj = self._create_one(
                        salon=salon,
                        day_of_week=day_int,
                        start_time=start_time,
                        end_time=end_time,
                        sort_order=sort_order,
                    )
                    created.append(self.get_serializer(created_obj).data)

            if errors and not created:
                return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

            return Response(
                {
                    'created_count': len(created),
                    'skipped_count': len(skipped),
                    'created': created,
                    'skipped': skipped,
                },
                status=status.HTTP_201_CREATED
            )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        day_of_week = serializer.validated_data['day_of_week']
        start_time = serializer.validated_data['start_time']
        end_time = serializer.validated_data['end_time']
        sort_order = serializer.validated_data.get('sort_order')

        existing = SalonWorkingHours.objects.filter(
            salon=salon,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
        ).first()
        if existing:
            return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)

        instance = self._create_one(
            salon=salon,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            sort_order=sort_order,
        )
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        working_hour = self.get_object()
        if working_hour.salon != self.request.user.salon:
            raise PermissionDenied('شما اجازه تغییر این ساعات کاری را ندارید')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.salon != self.request.user.salon:
            raise PermissionDenied('شما اجازه حذف این ساعات کاری را ندارید')
        instance.delete()


logger = logging.getLogger(__name__)

def _extract_host_from_request(request):
    """
    Return a tuple (host, source) where source is one of:
      - 'query'  -> from ?host=...
      - 'header' -> from X-Salon-Host header
      - 'host'   -> from request.get_host()
    If query param present but empty -> return (None, 'query-empty')
    """
    if 'host' in request.GET:
        val = request.GET.get('host')
        if val is None or val == '':
            return (None, 'query-empty')
        return (val.split(':')[0], 'query')

    header_val = request.headers.get('X-Salon-Host')
    if header_val:
        return (header_val.split(':')[0], 'header')

    host = request.get_host().split(':')[0]
    return (host, 'host')


class CurrentTenantAPIView(APIView):
    """
    GET /api/tenant/
    Behavior:
      - If ?host param provided and non-empty -> use it.
      - If ?host param provided but empty -> return 404.
      - Else if X-Salon-Host header present -> use it.
      - Else use request.get_host().
    Returns 200 with salon data if found, otherwise 404.
    This view is public (no auth).
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        host, source = _extract_host_from_request(request)
        logger.debug("CurrentTenantAPIView: host=%s (source=%s) for path=%s", host, source, request.path)

        if source == 'query-empty':
            logger.info("Tenant lookup with empty host parameter")
            return Response({"message": "Host parameter is empty"}, status=status.HTTP_404_NOT_FOUND)

        if not host:
            logger.warning("No host provided for tenant lookup")
            return Response({"message": "Host not provided"}, status=status.HTTP_404_NOT_FOUND)


        host_no_port = host.split(':')[0]

        salon = (
            Salon.objects.filter(
                Q(domain__iexact=host) |
                Q(host__iexact=host) |
                Q(domain__iexact=host_no_port) |
                Q(host__icontains=host_no_port)
            ).first()
        )
        if not salon:
            logger.info("Tenant not found for host=%s (source=%s)", host, source)
            return Response({"message": "Unknown tenant"}, status=status.HTTP_404_NOT_FOUND)

        logger.debug("Tenant found: salon_id=%s, host=%s", salon.id, host)
        serializer = SalonSerializer(salon)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ServiceListView(generics.ListAPIView):
    """
    GET /api/tenants/{salon_id}/services/
    Returns only active services for the tenant.
    """
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        salon_id = self.kwargs.get("salon_id")
        logger.debug("ServiceListView: fetching active services for salon_id=%s", salon_id)
        
        if not Salon.objects.filter(pk=salon_id).exists():
            logger.warning("ServiceListView: salon_id=%s does not exist", salon_id)
            raise NotFound(detail="Tenant not found")
        
        qs = Service.objects.filter(salon_id=salon_id, is_active=True, price__gt=0).order_by("id")
        try:
            _ = list(qs.values_list('price', flat=True)[:20])
            return qs
        except Exception as e:
            logger.exception("Error reading service prices for salon_id=%s: %s; attempting cleanup", salon_id, str(e))
            from decimal import Decimal
            with connection.cursor() as cursor:
                try:
                    cursor.execute("SELECT id, price FROM shops_service WHERE salon_id = %s", [salon_id])
                except Exception:
                    try:
                        cursor.execute("SELECT id, price FROM shops_service WHERE salon_id = ?", [salon_id])
                    except Exception:
                        logger.exception("Failed to read raw service prices for cleanup")
                        raise

                rows = cursor.fetchall()
                for row in rows:
                    sid, raw_price = row[0], row[1]
                    try:
                        if raw_price is None or (isinstance(raw_price, str) and raw_price.strip() == ''):
                            raise InvalidOperation('empty')
                        Decimal(str(raw_price))
                    except Exception:
                        try:
                            cursor.execute("UPDATE shops_service SET price = 0 WHERE id = %s", [sid])
                        except Exception:
                            try:
                                cursor.execute("UPDATE shops_service SET price = 0 WHERE id = ?", [sid])
                            except Exception:
                                logger.exception("Failed to update invalid price for service id=%s", sid)
            qs = Service.objects.filter(salon_id=salon_id, is_active=True, price__gt=0).order_by("id")
            return qs
        return Service.objects.filter(salon_id=salon_id, is_active=True, price__gt=0).order_by("id")


class WorkingHoursListView(generics.ListAPIView):
    """
    GET /api/tenants/{salon_id}/working-hours/
    Returns working hours for the tenant (public view for customers).
    Ensures they are ordered by day_of_week and start_time.
    """
    serializer_class = SalonWorkingHoursSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        salon_id = self.kwargs.get("salon_id")
        logger.debug("WorkingHoursListView: fetching working hours for salon_id=%s", salon_id)
        
        if not Salon.objects.filter(pk=salon_id).exists():
            logger.warning("WorkingHoursListView: salon_id=%s does not exist", salon_id)
            raise NotFound(detail="Tenant not found")
        
        qs = SalonWorkingHours.objects.filter(salon_id=salon_id).order_by('day_of_week', 'sort_order', 'start_time')
        
        for wh in qs:
            logger.debug(
                "WorkingHours: day=%d, start=%s, end=%s",
                wh.day_of_week,
                wh.start_time,
                wh.end_time
            )
        
        return qs

    
class SalonDetailView(generics.RetrieveAPIView):
    queryset = Salon.objects.all()
    serializer_class = SalonSerializer
    permission_classes = [AllowAny]


class SalonUpdateView(generics.RetrieveUpdateAPIView):
    """
    PATCH /api/salons/{id}/update/
    صاحب سالن می‌تواند فقط اطلاعات مجاز سالن خود را به‌روزرسانی کند.
    فیلدهای اساسی (نام، شهر، آدرس، جنسیت، دامنه) پس از ثبت قابل ویرایش نیستند.
    تلفن ثابت (phone, اختیاری) و موبایل (mobile, الزامی و یکتا) توسط مالک سالن قابل ویرایش هستند.
    موبایل در زمان ثبت‌نام از شماره کاربر گرفته می‌شود، اما بعداً هم از همین endpoint قابل تغییر است.
    """
    LOCKED_FIELDS = ['name', 'city', 'address', 'gender', 'domain', 'host']

    queryset = Salon.objects.all()
    serializer_class = SalonSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """بررسی اینکه کاربر صاحب سالن است"""
        user = self.request.user
        if not hasattr(user, 'salon') or not user.salon:
            raise PermissionDenied('شما یک سالن ندارید')
        
        if user.salon.id != self.kwargs.get('pk'):
            raise PermissionDenied('شما اجازه ویرایش این سالن را ندارید')
        
        return user.salon

    def partial_update(self, request, *args, **kwargs):
        """
        فیلدهای قفل‌شده را از درخواست حذف کرده و تنها فیلدهای مجاز را ذخیره می‌کند.
        همچنین owner_image_position را در فیلد settings سالن ذخیره می‌کند.
        """
        import json

        data = request.data.copy()
        locked_attempted = [f for f in self.LOCKED_FIELDS if f in data]
        for field in self.LOCKED_FIELDS:
            data.pop(field, None)

        if locked_attempted:
            logger.warning(
                "SalonUpdateView: attempt to modify locked fields %s for salon_id=%s — ignored",
                locked_attempted,
                self.get_object().id,
            )

        salon = self.get_object()

        owner_image_position = data.get('owner_image_position')
        if owner_image_position:
            try:
                pos = json.loads(owner_image_position) if isinstance(owner_image_position, str) else owner_image_position
                current_settings = salon.settings or {}
                current_settings['owner_image_position'] = pos
                salon.settings = current_settings
                salon.save(update_fields=['settings'])
            except (json.JSONDecodeError, Exception):
                pass

        request._full_data = data
        return super().partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        """تبدیل خطاهای یکتایی شماره‌ها به پیام فارسی و قابل‌نمایش در دیالوگ."""
        try:
            serializer.save()
        except IntegrityError as exc:
            message = str(exc).lower()
            if 'mobile' in message:
                raise serializers.ValidationError({'mobile': 'این شماره موبایل قبلاً برای سالن دیگری ثبت شده است'})
            if 'phone' in message:
                raise serializers.ValidationError({'phone': 'این شماره تلفن قبلاً برای سالن دیگری ثبت شده است'})
            raise serializers.ValidationError({'detail': 'خطا در ذخیره اطلاعات سالن'})


class SalonListView(generics.ListAPIView):
    """
    GET /api/salons/
    Returns all salons for customers to browse.
    """
    serializer_class = SalonSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Salon.objects.all()
        gender = self.request.GET.get('gender')
        if gender in ('male', 'female'):
            qs = qs.filter(gender=gender)
        user = getattr(self.request, 'user', None)
        if user and getattr(user, 'is_authenticated', False) and getattr(user, 'role', None) == 'customer':
            user_city = (getattr(user, 'city', '') or '').strip()
            if user_city:
                qs = qs.filter(city__iexact=user_city)
        return qs


class StatsAPIView(APIView):
    """
    GET /api/stats/
    Returns simple platform-wide statistics used on the frontend home page.
    {
      "salons_count": int,
      "confirmed_bookings": int,
      "total_bookings": int,
      "satisfaction_percent": int  # 0-100
    }
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        salons_count = Salon.objects.count()
        total_bookings = Booking.objects.count()
        confirmed_bookings = Booking.objects.filter(status='confirmed').count()

        if total_bookings > 0:
            try:
                satisfaction_percent = int((confirmed_bookings / total_bookings) * 100)
            except Exception:
                satisfaction_percent = 0
        else:
            satisfaction_percent = 0

        return Response({
            'salons_count': salons_count,
            'confirmed_bookings': confirmed_bookings,
            'total_bookings': total_bookings,
            'satisfaction_percent': satisfaction_percent,
        })


class ToggleSalonStatusAPIView(APIView):
    """
    PATCH /api/salon-status/toggle/
    تغییر وضعیت سالن - فعال/غیرفعال کردن
    Request body:
    {
        "action": "disable" | "enable",
        "days": optional int (تعداد روز برای غیرفعال بودن),
        "disable_reason": optional string (دلیل غیرفعال کردن)
    }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        user = request.user
        
        # بررسی کنید که کاربر مالک سالن است
        if user.role != 'owner' or not hasattr(user, 'salon') or not user.salon:
            return Response(
                {'error': 'فقط مالک سالن می‌تواند این عمل را انجام دهد'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        salon = user.salon
        action = request.data.get('action', 'toggle')
        days = request.data.get('days')
        disable_reason = request.data.get('disable_reason', '')
        
        from datetime import timedelta
        
        try:
            if action == 'disable':
                salon.is_active = False
                salon.disable_reason = disable_reason
                
                if days and days > 0:
                    salon.disabled_until = timezone.now() + timedelta(days=int(days))
                else:
                    salon.disabled_until = None
                
                salon.save()
                return Response({
                    'status': 'success',
                    'message': f'سالن شما تا {days} روز غیرفعال شد' if days else 'سالن شما غیرفعال شد',
                    'salon': SalonSerializer(salon).data
                }, status=status.HTTP_200_OK)
            
            elif action == 'enable':
                salon.is_active = True
                salon.disabled_until = None
                salon.disable_reason = ''
                salon.save()
                
                return Response({
                    'status': 'success',
                    'message': 'سالن شما فعال شد',
                    'salon': SalonSerializer(salon).data
                }, status=status.HTTP_200_OK)
            
            else:
                return Response(
                    {'error': 'اقدام نامعتبر است'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except Exception as e:
            logger.exception("Error toggling salon status")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ---- Reviews API ----
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateView(generics.ListCreateAPIView):
    """GET: list reviews for a salon (public)
       POST: create review (authenticated customers only)
    """
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        salon_id = self.kwargs.get('salon_id')
        return Review.objects.filter(salon_id=salon_id).order_by('-created_at')

    def perform_create(self, serializer):
        salon_id = self.kwargs.get('salon_id')
        try:
            salon = Salon.objects.get(pk=salon_id)
        except Salon.DoesNotExist:
            raise NotFound('سالن پیدا نشد')
        serializer.save(salon=salon)


class OwnerReplyAPIView(APIView):
    """POST: salon owner replies to a review"""
    permission_classes = [IsAuthenticated]

    def post(self, request, salon_id, review_id, *args, **kwargs):
        user = request.user
        if user.role != 'owner' or not user.salon or user.salon.id != int(salon_id):
            raise PermissionDenied('فقط مالک سالن می‌تواند پاسخ دهد')
        try:
            review = Review.objects.get(pk=review_id, salon_id=salon_id)
        except Review.DoesNotExist:
            raise NotFound('نظر پیدا نشد')
        reply_text = request.data.get('owner_reply')
        if reply_text is None:
            return Response({'error': 'متن پاسخ داده نشده'}, status=status.HTTP_400_BAD_REQUEST)
        review.owner_reply = reply_text
        review.owner_reply_at = timezone.now()
        review.save()
        serializer = ReviewSerializer(review, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)



class PortfolioCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = PortfolioCategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        salon_id = self.kwargs.get('salon_id')
        return PortfolioCategory.objects.filter(salon_id=salon_id).order_by('order', 'created_at')

    def perform_create(self, serializer):
        salon_id = self.kwargs.get('salon_id')
        user = self.request.user

        if user.role != 'owner' or not user.salon or user.salon.id != int(salon_id):
            raise PermissionDenied('فقط مالک سالن می‌تواند دسته‌بندی اضافه کند')

        try:
            salon = Salon.objects.get(pk=salon_id)
        except Salon.DoesNotExist:
            raise NotFound('سالن پیدا نشد')

        current_count = PortfolioCategory.objects.filter(salon=salon).count()
        if current_count >= 10:
            raise serializers.ValidationError({'detail': 'حداکثر ۱۰ دسته‌بندی مجاز است.'})

        try:
            serializer.save(salon=salon)
        except IntegrityError:
            raise serializers.ValidationError({'name': 'یک دسته‌بندی با این نام قبلاً ثبت شده است.'})


class PortfolioItemListCreateView(generics.ListCreateAPIView):
    """GET: list portfolio items for a category (public)
       POST: create portfolio item (owner only)
    """
    serializer_class = PortfolioItemSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        category_id = self.kwargs.get('category_id')
        return PortfolioItem.objects.filter(category_id=category_id).order_by('order', 'created_at')

    def perform_create(self, serializer):
        category_id = self.kwargs.get('category_id')
        user = self.request.user
        try:
            category = PortfolioCategory.objects.get(pk=category_id)
        except PortfolioCategory.DoesNotExist:
            raise NotFound('دسته‌بندی پیدا نشد')

        if user.role != 'owner' or not user.salon or user.salon.id != category.salon.id:
            raise PermissionDenied('فقط مالک سالن می‌تواند عکس اضافه کند')

        serializer.context['category'] = category
        serializer.save(category=category)


class PortfolioItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE: manage portfolio item"""
    serializer_class = PortfolioItemSerializer
    permission_classes = [AllowAny]  # GET is public, but PATCH/DELETE need permission check

    def get_queryset(self):
        return PortfolioItem.objects.all()

    def perform_update(self, serializer):
        user = self.request.user
        item = self.get_object()
        
        if user.role != 'owner' or not user.salon or user.salon.id != item.category.salon.id:
            raise PermissionDenied('فقط مالک سالن می‌تواند ویرایش کند')
        
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        if user.role != 'owner' or not user.salon or user.salon.id != instance.category.salon.id:
            raise PermissionDenied('فقط مالک سالن می‌تواند حذف کند')
        
        instance.delete()


class PortfolioCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE: manage portfolio category"""
    serializer_class = PortfolioCategorySerializer
    permission_classes = [AllowAny]  # GET is public, but PATCH/DELETE need permission check

    def get_queryset(self):
        return PortfolioCategory.objects.all()

    def perform_update(self, serializer):
        user = self.request.user
        category = self.get_object()
        
        if user.role != 'owner' or not user.salon or user.salon.id != category.salon.id:
            raise PermissionDenied('فقط مالک سالن می‌تواند ویرایش کند')
        
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        if user.role != 'owner' or not user.salon or user.salon.id != instance.salon.id:
            raise PermissionDenied('فقط مالک سالن می‌تواند حذف کند')
        
        instance.delete()



class SalonByQRCodeView(generics.RetrieveAPIView):
    """
    GET /api/salons/qr/<qr_code>/
    دریافت اطلاعات سالن بر اساس QR Code
    این endpoint برای مشتریانی است که QR Code سالن را اسکن کردند
    """
    serializer_class = SalonSerializer
    permission_classes = [AllowAny]
    lookup_field = 'qr_code'
    
    def get_queryset(self):
        return Salon.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        qr_code = self.kwargs.get('qr_code')
        try:
            salon = Salon.objects.get(qr_code=qr_code)
            logger.info(f"Salon found by QR code: {salon.id}")
            serializer = self.get_serializer(salon)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Salon.DoesNotExist:
            logger.warning(f"Salon not found for QR code: {qr_code}")
            return Response(
                {'error': 'سالن با این QR Code پیدا نشد'},
                status=status.HTTP_404_NOT_FOUND
            )


class MyQRCodeView(APIView):
    """
    GET /api/my-salon/qr-code/
    دریافت QR Code سالن خودم
    این endpoint فقط برای مالک سالن است
    Response:
    {
        "qr_code": "uuid-string",
        "salon_id": int,
        "salon_name": "نام سالن",
        "qr_url": "https://example.com/qr/<uuid>"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        
        if user.role != 'owner' or not hasattr(user, 'salon') or not user.salon:
            return Response(
                {'error': 'فقط مالک سالن می‌تواند QR Code خود را ببیند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        salon = user.salon
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        qr_url = f"{frontend_url}/qr/{salon.qr_code}"
        
        logger.info(f"QR code retrieved for salon: {salon.id}")
        
        return Response({
            'qr_code': str(salon.qr_code),
            'salon_id': salon.id,
            'salon_name': salon.name,
            'qr_url': qr_url,
            'salon': SalonSerializer(salon).data
        }, status=status.HTTP_200_OK)