from decimal import Decimal
import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email as django_validate_email
from rest_framework import serializers
from shops.models import Salon, Service

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    salon_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    salon_city = serializers.CharField(write_only=True, required=False, allow_blank=True)
    salon_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    salon_gender = serializers.CharField(write_only=True, required=False, allow_blank=True)
    salon_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    services = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone_number",
            "city",
            "role",
            "gender",
            "salon_name",
            "salon_city",
            "salon_phone",
            "salon_gender",
            "salon_address",
            "services",
        )

    def validate_city(self, value):
        """اعتبارسنجی شهر - باید در لیست شهرها باشد"""
        if not value:
            return value
        valid_cities = [city[0] for city in IRAN_CITIES]
        if value not in valid_cities:
            raise serializers.ValidationError("شهر انتخاب شده معتبر نیست.")
        return value
    
    
    def validate_city(self, value):
        """اعتبارسنجی شهر - باید در لیست شهرها باشد"""
        if not value:
            return value
        valid_cities = [city[0] for city in IRAN_CITIES]
        if value not in valid_cities:
            raise serializers.ValidationError("شهر انتخاب شده معتبر نیست.")
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "رمزهای عبور مطابقت ندارند"})

        # برای مشتری، شهر الزامی است
        if attrs.get("role") == "customer" and not attrs.get("city", "").strip():
            raise serializers.ValidationError({"city": "شهر برای مشتری الزامی است"})

        # برای مالک، اطلاعات سالن الزامی است
        if attrs.get("role") == "owner":
            if not attrs.get("salon_name", "").strip():
                raise serializers.ValidationError({"salon_name": "نام سالن برای مالک الزامی است"})
            if not attrs.get("salon_city", "").strip():
                raise serializers.ValidationError({"salon_city": "شهر سالن برای مالک الزامی است"})
            if not attrs.get("salon_gender", "").strip():
                raise serializers.ValidationError({"salon_gender": "جنسیت سالن برای مالک الزامی است"})
            if not attrs.get("salon_address", "").strip():
                raise serializers.ValidationError({"salon_address": "آدرس سالن برای مالک الزامی است"})

        try:
            validate_password(attrs.get("password"))
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        return attrs
    
    
    def validate_username(self, value):
        value = value.strip()
        if len(value) < 6:
            raise serializers.ValidationError("نام کاربری باید حداقل 6 کاراکتر باشد")
        if not re.match(r"^[a-zA-Z0-9_-]+$", value):
            raise serializers.ValidationError("نام کاربری فقط می‌تواند شامل حروف، اعداد، underscore و dash باشد")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("این نام کاربری قبلاً ثبت شده است")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است")
        try:
            django_validate_email(value)
        except serializers.ValidationError:
            raise serializers.ValidationError("ایمیل معتبر نیست")
        return value

    def validate_phone_number(self, value):
        if not value:
            return value

        value = value.strip()
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("این شماره تلفن قبلاً ثبت شده است")

        cleaned = value.replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
        if cleaned.startswith("0"):
            cleaned = "98" + cleaned[1:]
        elif cleaned.startswith("0098"):
            cleaned = "98" + cleaned[2:]
        elif cleaned.startswith("+98"):
            cleaned = cleaned[1:]
        elif not cleaned.startswith("98"):
            cleaned = "98" + cleaned

        if not re.match(r"^98\d{10}$", cleaned):
            raise serializers.ValidationError(
                "شماره تلفن معتبر نیست. مثال‌های درست: 09123456789, +989123456789"
            )

        return value

    def validate_salon_phone(self, value):
        if not value:
            return value

        value = value.strip()
        if Salon.objects.filter(phone=value).exists():
            raise serializers.ValidationError("این شماره تلفن سالن قبلاً ثبت شده است")

        cleaned = value.replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
        if cleaned.startswith("0"):
            cleaned = "98" + cleaned[1:]
        elif cleaned.startswith("0098"):
            cleaned = "98" + cleaned[2:]
        elif cleaned.startswith("+98"):
            cleaned = cleaned[1:]
        elif not cleaned.startswith("98"):
            cleaned = "98" + cleaned

        if not re.match(r"^98\d{10}$", cleaned):
            raise serializers.ValidationError(
                "شماره تلفن سالن معتبر نیست. مثال‌های درست: 09123456789, +989123456789"
            )

        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "رمزهای عبور مطابقت ندارند"})

        if attrs.get("role") == "owner":
            if not attrs.get("salon_name", "").strip():
                raise serializers.ValidationError({"salon_name": "نام سالن برای مالک الزامی است"})
            if not attrs.get("salon_city", "").strip():
                raise serializers.ValidationError({"salon_city": "شهر سالن برای مالک الزامی است"})
            if not attrs.get("salon_gender", "").strip():
                raise serializers.ValidationError({"salon_gender": "جنسیت سالن برای مالک الزامی است"})
            if not attrs.get("salon_address", "").strip():
                raise serializers.ValidationError({"salon_address": "آدرس سالن برای مالک الزامی است"})

        try:
            validate_password(attrs.get("password"))
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        salon_name = validated_data.pop("salon_name", None)
        salon_city = validated_data.pop("salon_city", None)
        salon_phone = validated_data.pop("salon_phone", None)
        salon_gender = validated_data.pop("salon_gender", None)
        salon_address = validated_data.pop("salon_address", None)
        services = validated_data.pop("services", None)

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        try:
            if user.role == "owner" and salon_name:
                import uuid

                domain_candidate = f"{user.username}-{uuid.uuid4().hex[:8]}.local"
                salon = Salon.objects.create(
                    name=salon_name,
                    city=salon_city or "",
                    phone=salon_phone or "",
                    mobile=user.phone_number or None,
                    address=salon_address or "",
                    gender=salon_gender or "",
                    domain=domain_candidate,
                    host="localhost",
                )
                user.salon = salon
                user.save()

                default_services_male = [
                    "اصلاح مو",
                    "اصلاح ریش",
                    "گریم داماد",
                    "شست و شو سر",
                    "حالت مو",
                    "پاکسازی پوست",
                ]

                default_services_female = [
                    "کوتاهی مو",
                    "رنگ مو",
                    "میکاپ عروس",
                    "شست و شو سر",
                    "حالت مو",
                    "پاکسازی پوست",
                ]

                if salon_gender == "female":
                    default_services = default_services_female
                else:
                    default_services = default_services_male

                if services and isinstance(services, list) and len(services) > 0:
                    for s in services:
                        name = s.get("name") or s.get("title")
                        price = s.get("price", 0)
                        duration = s.get("duration", 30)
                        try:
                            price_val = Decimal(str(price))
                        except Exception:
                            price_val = Decimal("0")
                        try:
                            duration_val = int(duration)
                            if duration_val < 1:
                                duration_val = 30
                        except Exception:
                            duration_val = 30
                        Service.objects.create(
                            salon=salon,
                            name=name,
                            duration_minutes=duration_val,
                            price=price_val,
                            is_active=True,
                        )
                else:
                    for name in default_services:
                        Service.objects.create(
                            salon=salon,
                            name=name,
                            duration_minutes=30,
                            price=0,
                            is_active=True,
                        )
        except Exception:
            import logging

            logging.exception("Error creating salon for owner")

        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True, required=True, max_length=150)

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("نام کاربری الزامی است")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(write_only=True, required=True)
    token = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=10)
    password_confirm = serializers.CharField(write_only=True, required=True, min_length=10)

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "رمزهای عبور مطابقت ندارند"})

        try:
            validate_password(attrs.get("password"))
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        return attrs