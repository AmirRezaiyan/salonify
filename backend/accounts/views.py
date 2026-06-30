import hashlib
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView

from common.email_service import send_password_reset_email
from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()

PASSWORD_RESET_GENERIC_MESSAGE = "اگر این حساب وجود داشته باشد، لینک بازیابی به ایمیل ثبت‌شده ارسال می‌شود."
PASSWORD_RESET_RATE_LIMIT_MESSAGE = "تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید."
PASSWORD_RESET_LIMIT = getattr(settings, "PASSWORD_RESET_LIMIT", 5)
PASSWORD_RESET_WINDOW_SECONDS = getattr(settings, "PASSWORD_RESET_WINDOW_SECONDS", 15 * 60)


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _hash_scope(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:20]


def _rate_limit(scope: str) -> tuple[bool, int]:
    cache_key = f"password-reset:{scope}"
    if cache.add(cache_key, 1, timeout=PASSWORD_RESET_WINDOW_SECONDS):
        return False, 1

    current = cache.incr(cache_key)
    return current > PASSWORD_RESET_LIMIT, current


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        from django.contrib.auth import authenticate

        username = attrs.get("username", "")
        password = attrs.get("password", "")

        try:
            User.objects.get(username=username)
        except User.DoesNotExist:
            raise AuthenticationFailed({"username": "نام کاربری وجود ندارد یا اشتباه است"})

        user_auth = authenticate(username=username, password=password)
        if user_auth is None:
            raise AuthenticationFailed({"password": "رمز عبور نادرست است"})

        if not user_auth.is_active:
            raise AuthenticationFailed({"general": "این حساب کاربری غیرفعال شده است"})

        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "city": getattr(user, 'city', ''),
        }
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                user = getattr(serializer, "user", None)
            except Exception:
                user = None

            if user:
                user_data = {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "phone_number": getattr(user, "phone_number", None),
                    "gender": getattr(user, "gender", None),
                    "city": getattr(user, "city", None),
                }
                if user.role in ["owner", "staff"] and getattr(user, "salon", None):
                    user_data["salon"] = {
                        "id": user.salon.id,
                        "name": user.salon.name,
                        "city": user.salon.city,
                        "phone": user.salon.phone,
                    }
                response.data["user"] = user_data
            else:
                response.data["user"] = None
        return response


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    queryset = User.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            try:
                logger.error("Register payload: %s", request.data)
            except Exception:
                logger.exception("Failed to log request.data for register")
            errs = getattr(serializer, "errors", None)
            if errs:
                logger.error("Register serializer errors: %s", errs)
            logger.exception("Registration validation failed: %s", str(e))

            if hasattr(serializer, "errors") and serializer.errors:
                error_dict = {}
                for field, messages in serializer.errors.items():
                    if isinstance(messages, list):
                        error_dict[field] = str(messages[0])
                    else:
                        error_dict[field] = str(messages)

                return Response(error_dict, status=status.HTTP_400_BAD_REQUEST)

            return Response({"detail": "ثبت نام ناموفق بود"}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        logger.info("User registered successfully: user_id=%s, username=%s", user.id, user.username)
        data = {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "gender": user.gender,
                "phone_number": getattr(user, "phone_number", None),
            },
        }
        return Response(data, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": getattr(user, "role", "customer"),
            "phone_number": getattr(user, "phone_number", None),
            "gender": getattr(user, "gender", None),
            "city": getattr(user, "city", ""),
        }
        if getattr(user, "salon", None):
            user_data["salon"] = {
                "id": user.salon.id,
                "name": user.salon.name,
                "city": user.salon.city,
                "phone": user.salon.phone,
            }
        return Response({"user": user_data})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"].strip()

        ip = _client_ip(request)
        ip_limited, _ = _rate_limit(f"ip:{ip}")
        username_limited, _ = _rate_limit(f"user:{_hash_scope(username.lower())}")

        if ip_limited or username_limited:
            return Response(
                {"message": PASSWORD_RESET_RATE_LIMIT_MESSAGE},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = User.objects.filter(username=username).first()
        if not user or not getattr(user, "email", None):
            return Response({"message": PASSWORD_RESET_GENERIC_MESSAGE}, status=status.HTTP_200_OK)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        if frontend_url:
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}"
        else:
            reset_url = request.build_absolute_uri(f"/reset-password/{uid}/{token}")

        try:
            send_password_reset_email(user, reset_url)
        except Exception:
            logger.exception("Unexpected error while sending password reset email for user_id=%s", user.id)

        return Response({"message": PASSWORD_RESET_GENERIC_MESSAGE}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["password"]

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"detail": "لینک بازیابی نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "لینک بازیابی معتبر نیست یا منقضی شده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"message": "رمز عبور با موفقیت تغییر کرد."}, status=status.HTTP_200_OK)
