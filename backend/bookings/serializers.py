from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from .models import Booking, Service

import logging

logger = logging.getLogger(__name__)


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "salon",
            "service",
            "customer_name",
            "customer_phone",
            "customer_email",
            "start_at",
            "end_at",
            "status",
            "meta",
            "created_at",
        ]
        read_only_fields = ["id", "end_at", "status", "created_at", "salon",
                            "customer_name", "customer_phone", "customer_email"]

    def validate_start_at(self, value):
        now = timezone.now()
        if value < now - timezone.timedelta(seconds=30):
            logger.warning("Validation failed: start_at in the past: %s", value)
            raise serializers.ValidationError("start_at cannot be in the past")
        return value

    def validate_customer_phone(self, value):
        if len(value) < 6:
            logger.warning("Validation failed: invalid phone number: %s", value)
            raise serializers.ValidationError("invalid phone number")
        return value

    def validate_customer_email(self, value):
        if not value or not value.strip():
            logger.warning("Validation failed: customer_email is required")
            raise serializers.ValidationError("customer_email is required")
        return value

    def validate_service(self, value):
        if not value.is_active:
            logger.warning("Validation failed: booking for inactive service_id=%s", value.id)
            raise serializers.ValidationError("This service is not available for booking")
        return value

    def validate(self, attrs):
        """
        جلوگیری از رزرو نوبت در سالنی که در شهر دیگری نسبت به شهر ثبت‌شده‌ی
        مشتری قرار دارد. این چک علاوه بر فیلتر سمت فرانت‌اند انجام می‌شود تا
        حتی در صورت دستکاری مستقیم درخواست (curl/Postman/فرانت قدیمی)، رزرو
        از شهر اشتباه رد شود.
        """
        request = self.context.get("request")
        salon = getattr(request, "salon", None)
        user = getattr(request, "user", None)

        if (
            salon is not None
            and user is not None
            and getattr(user, "is_authenticated", False)
            and getattr(user, "role", None) == "customer"
        ):
            customer_city = (getattr(user, "city", "") or "").strip()
            salon_city = (getattr(salon, "city", "") or "").strip()

            if customer_city and salon_city and customer_city.lower() != salon_city.lower():
                logger.warning(
                    "City mismatch on booking attempt: user_id=%s user_city=%s salon_id=%s salon_city=%s",
                    user.id, customer_city, salon.id, salon_city,
                )
                raise PermissionDenied(
                    "این سالن متعلق به شهر دیگری است و امکان رزرو نوبت برای شهر شما وجود ندارد."
                )

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        salon = getattr(request, "salon", None)
        if not salon:
            logger.error("Booking creation failed: Salon not detected in request")
            raise serializers.ValidationError("Salon not detected (tenant middleware)")
        validated_data["salon"] = salon
        return super().create(validated_data)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "duration_minutes", "price", "salon", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_duration_minutes(self, value):
        if value <= 0:
            logger.warning("Validation failed: invalid duration_minutes: %s", value)
            raise serializers.ValidationError("duration_minutes must be greater than 0")
        return value

    def validate_price(self, value):
        if value < 0:
            logger.warning("Validation failed: negative price: %s", value)
            raise serializers.ValidationError("price cannot be negative")
        return value


class BookingListSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    services = serializers.SerializerMethodField()
    salon_name = serializers.CharField(source="salon.name", read_only=True)
    can_cancel = serializers.SerializerMethodField()
    can_reschedule = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "salon",
            "salon_name",
            "service",
            "services",
            "customer_name",
            "customer_phone",
            "customer_email",
            "start_at",
            "end_at",
            "status",
            "meta",
            "created_at",
            "can_cancel",
            "can_reschedule",
        ]
        read_only_fields = ["id", "end_at", "created_at", "salon"]

    def get_services(self, obj):
        try:
            return obj.meta.get("services", []) if isinstance(obj.meta, dict) else []
        except Exception:
            return []

    def _can_modify(self, obj):
        if obj.status not in ["pending", "confirmed"]:
            return False
        return (obj.start_at - timezone.now()) >= timedelta(hours=24)

    def get_can_cancel(self, obj):
        return self._can_modify(obj)

    def get_can_reschedule(self, obj):
        return self._can_modify(obj)