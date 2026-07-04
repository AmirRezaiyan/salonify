from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Salon, Service, SalonWorkingHours, Review, PortfolioCategory, PortfolioItem
import re

User = get_user_model()


def _normalize_mobile(value):
    """Normalize Iranian mobile numbers to canonical 98XXXXXXXXXX format."""
    raw = '' if value is None else str(value).strip()
    if not raw:
        return None

    digits = re.sub(r'\D', '', raw)

    if digits.startswith('0098'):
        digits = digits[4:]
    elif digits.startswith('98'):
        digits = digits[2:]
    elif digits.startswith('0'):
        digits = digits[1:]
    else:
        return None

    if len(digits) != 10 or not digits.startswith('9'):
        return None

    return '98' + digits


def _normalize_phone(value):
    """Normalize fixed-line numbers by keeping digits only."""
    raw = '' if value is None else str(value).strip()
    if not raw:
        return None

    digits = re.sub(r'\D', '', raw)
    return digits or None


class SalonSerializer(serializers.ModelSerializer):
    is_currently_disabled = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Salon
        fields = [
            "id", "qr_code", "name", "domain", "host", "logo_url",
            "theme_color", "phone", "mobile", "city", "address",
            "gender", "settings", "is_active", "disabled_until",
            "disable_reason", "is_currently_disabled", "average_rating",
            "review_count", "owner_image", "owner_description",
        ]
        read_only_fields = ["id", "qr_code", "is_currently_disabled", "average_rating", "review_count"]

    def get_is_currently_disabled(self, obj):
        return obj.is_currently_disabled()

    def get_average_rating(self, obj):
        from django.db.models import Avg
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

    def get_review_count(self, obj):
        return obj.reviews.count()

    def validate_phone(self, value):
        normalized = _normalize_phone(value)
        if not normalized:
            if value in (None, '', 'null'):
                return None
            raise serializers.ValidationError('شماره تلفن معتبر نیست. نمونه درست: 02112345678')

        if len(normalized) < 8 or len(normalized) > 15:
            raise serializers.ValidationError('شماره تلفن معتبر نیست. نمونه درست: 02112345678')

        qs = Salon.objects.exclude(phone__isnull=True).exclude(phone='')
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        for salon in qs.only('id', 'phone'):
            if _normalize_phone(salon.phone) == normalized:
                raise serializers.ValidationError('این شماره تلفن قبلاً برای سالن دیگری ثبت شده است')

        return normalized

    def validate_mobile(self, value):
        normalized = _normalize_mobile(value)
        if not normalized:
            raise serializers.ValidationError('شماره موبایل معتبر نیست. نمونه درست: 09910803518 یا +989910803518')

        user_qs = User.objects.exclude(phone_number__isnull=True).exclude(phone_number='')
        request = self.context.get('request')
        current_user = getattr(request, 'user', None)

        if current_user and getattr(current_user, 'id', None):
            user_qs = user_qs.exclude(pk=current_user.id)

        for user in user_qs.only('id', 'phone_number'):
            if _normalize_mobile(user.phone_number) == normalized:
                raise serializers.ValidationError('این شماره موبایل قبلاً برای یک کاربر دیگر ثبت شده است')

        qs = Salon.objects.exclude(mobile__isnull=True).exclude(mobile='')
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        for salon in qs.only('id', 'mobile'):
            if _normalize_mobile(salon.mobile) == normalized:
                raise serializers.ValidationError('این شماره موبایل قبلاً برای سالن دیگری ثبت شده است')

        return normalized


class SalonWorkingHoursSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = SalonWorkingHours
        fields = ["id", "salon", "day_of_week", "day_name", "start_time", "end_time", "sort_order"]
        read_only_fields = ["id", "salon", "day_name"]

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({'end_time': 'زمان پایان باید بعد از زمان شروع باشد'})
        return data


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "price", "duration_minutes", "is_active", "salon", "created_at"]
        read_only_fields = ["id", "salon", "created_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('نام خدمت نمی‌تواند خالی باشد')

        salon = None
        if self.instance is not None:
            salon = self.instance.salon
        else:
            request = self.context.get('request')
            user = getattr(request, 'user', None)
            salon = getattr(user, 'salon', None)

        if salon is not None:
            qs = Service.objects.filter(salon=salon, name__iexact=value, is_active=True)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('خدمتی با این نام قبلاً ثبت شده است')

        return value

    def validate_duration_minutes(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('مدت زمان باید عددی بزرگ‌تر از صفر باشد')
        return value

    def validate_price(self, value):
        if value in (None, ''):
            raise serializers.ValidationError('قیمت این سرویس باید بیشتر از صفر باشد')

        try:
            price = Decimal(str(value))
        except Exception:
            raise serializers.ValidationError('قیمت این سرویس باید یک عدد معتبر باشد')

        if price <= 0:
            raise serializers.ValidationError('قیمت این سرویس باید بیشتر از صفر باشد')
        return price


class ReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ["id", "salon", "user", "user_username", "rating", "text", "owner_reply", "owner_reply_at", "created_at"]
        read_only_fields = ["id", "salon", "user", "user_username", "owner_reply", "owner_reply_at", "created_at"]

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError('کاربر باید وارد شده باشد')
        if user.role != 'customer':
            raise serializers.ValidationError('فقط مشتریان می‌توانند نظر ثبت کنند')
        validated_data['user'] = user
        return super().create(validated_data)


class PortfolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItem
        fields = ["id", "category", "title", "description", "image", "order", "created_at"]
        read_only_fields = ["id", "category", "created_at"]

    def validate(self, data):
        if self.instance is None:
            category = data.get('category') or self.context.get('category')
            if category:
                current_count = PortfolioItem.objects.filter(category=category).count()
                if current_count >= 5:
                    raise serializers.ValidationError(
                        {'category': 'تعداد تصاویر در این دسته حداکثر ۵ عدد می‌تواند باشد.'}
                    )
        description = data.get('description', '')
        if description and len(description) > 500:
            raise serializers.ValidationError(
                {'description': 'توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد.'}
            )
        return data


class PortfolioCategorySerializer(serializers.ModelSerializer):
    items = PortfolioItemSerializer(many=True, read_only=True)

    class Meta:
        model = PortfolioCategory
        fields = ["id", "salon", "name", "description", "order", "items", "created_at"]
        read_only_fields = ["id", "salon", "created_at"]

    def validate_name(self, value):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.salon:
            salon = request.user.salon
            qs = PortfolioCategory.objects.filter(salon=salon, name__iexact=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('یک دسته‌بندی با این نام قبلاً ثبت شده است.')
        return value