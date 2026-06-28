# backend/bookings/services.py
import os
import uuid
import logging
from datetime import timedelta, timezone as dt_timezone
from typing import Optional, Dict

import redis
from django.db import transaction
from django.utils import timezone

from bookings.models import Booking
from shops.models import Service, SalonWorkingHours
from common.sms_service import get_sms_provider
from bookings.tasks import send_confirmation_sms

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

_UNLOCK_LUA = """
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
"""

unlock_script = redis_client.register_script(_UNLOCK_LUA)


class SlotTaken(Exception):
    """Raised when a slot is not available (either locked or overlapping)."""
    pass


class WorkingHoursNotConfigured(Exception):
    """Raised when salon has no working hours configured."""
    pass


class OutsideWorkingHours(Exception):
    """Raised when booking time is outside salon's working hours."""
    pass


class BookingModificationWindowClosed(Exception):
    """Raised when customer tries to cancel outside the allowed window."""
    pass


class BookingOwnershipMismatch(Exception):
    """Raised when a customer tries to modify someone else's booking."""
    pass


def _check_salon_working_hours(salon_id: int, start_at, end_at) -> bool:
    """
    Check if the booking start_at and end_at fall within salon's working hours.

    Returns True if booking is within working hours, raises OutsideWorkingHours otherwise.
    Converts UTC times to Iran local time (UTC+3:30) before checking.
    """
    from datetime import timezone as dt_timezone, timedelta as dt_timedelta

    iran_offset = dt_timezone(dt_timedelta(hours=3, minutes=30))
    start_at_local = start_at.astimezone(iran_offset)
    end_at_local = end_at.astimezone(iran_offset)

    booking_day_of_week = start_at_local.weekday()  
    our_day_of_week = (booking_day_of_week + 2) % 7  

    working_hours = SalonWorkingHours.objects.filter(
        salon_id=salon_id,
        day_of_week=our_day_of_week
    ).order_by("start_time")

    if not working_hours.exists():
        raise OutsideWorkingHours("سالن در این روز باز نیست")

    booking_start_time = start_at_local.time()
    booking_end_time = end_at_local.time()

    for wh in working_hours:
        if wh.start_time <= booking_start_time and booking_end_time <= wh.end_time:
            return True

    raise OutsideWorkingHours("زمان رزرو در ساعات کاری سالن قرار ندارد")


def _lock_key(salon_id: int, start_iso: str) -> str:
    return f"lock:salon:{salon_id}:slot:{start_iso}"


def _acquire_lock(key: str, token: str, ttl_ms: int = 10000) -> bool:
    """Try to acquire a token-based lock."""
    return redis_client.set(key, token, nx=True, px=ttl_ms)


def _release_lock(key: str, token: str) -> bool:
    """Release lock only if token matches (atomic via Lua script)."""
    try:
        res = unlock_script(keys=[key], args=[token])
        return bool(res)
    except Exception as e:
        logger.exception("Failed to release lock: %s", e)
        return False


def make_booking(
    salon_id: int,
    service_id: int = None,
    service_ids: Optional[list] = None,
    start_at=None,
    customer_name: str = None,
    customer_phone: str = None,
    customer_email: str = None,
    meta: Optional[Dict] = None,
    lock_ttl_ms: int = 10000
) -> Booking:
    """
    Create a booking atomically:
    1. Acquire token-based Redis lock.
    2. In transaction.atomic() with select_for_update(): check overlapping bookings.
    3. If free: create Booking, enqueue Celery tasks.
    4. Release lock.
    Raises SlotTaken on failure.
    """
    if start_at.tzinfo is None:
        start_at = timezone.make_aware(start_at, timezone=dt_timezone.utc)

    if service_ids:
        services_qs = list(Service.objects.filter(pk__in=service_ids, salon_id=salon_id))
        if not services_qs or len(services_qs) != len(service_ids):
            raise ValueError("one or more services not found for this salon")

        duration = sum([s.duration_minutes or 0 for s in services_qs])
        primary_service = services_qs[0]
        meta = meta or {}
        meta_services = []
        for s in services_qs:
            meta_services.append({
                "id": s.id,
                "name": s.name,
                "duration_minutes": s.duration_minutes,
                "price": float(s.price) if s.price is not None else 0,
            })
        meta["services"] = meta_services
        service = primary_service
        end_at = start_at + timezone.timedelta(minutes=duration)
    else:
        service = Service.objects.select_related("salon").get(pk=service_id)
        if service.salon_id != int(salon_id):
            raise ValueError("service does not belong to the provided salon")

        duration = service.duration_minutes
        end_at = start_at + timezone.timedelta(minutes=duration)

    start_iso = start_at.isoformat()
    key = _lock_key(salon_id, start_iso)
    token = str(uuid.uuid4())

    _check_salon_working_hours(salon_id, start_at, end_at)

    acquired = _acquire_lock(key, token, ttl_ms=lock_ttl_ms)
    if not acquired:
        logger.debug("Lock already acquired for %s (salon=%s)", start_iso, salon_id)
        raise SlotTaken("lock")

    try:
        with transaction.atomic():
            overlapping = Booking.objects.select_for_update().filter(
                salon_id=salon_id,
                status__in=["pending", "confirmed"],
                start_at__lt=end_at,
                end_at__gt=start_at,
            ).exists()

            if overlapping:
                logger.debug("Found overlapping booking for %s salon=%s", start_iso, salon_id)
                raise SlotTaken("overlap")

            customer_booking_same_time = Booking.objects.select_for_update().filter(
                customer_phone=customer_phone,
                status__in=["pending", "confirmed"],
                start_at__lt=end_at,
                end_at__gt=start_at,
            ).exists()

            if customer_booking_same_time:
                logger.warning("Customer %s already has a booking at this time (%s)", customer_phone, start_iso)
                raise SlotTaken("customer_duplicate_time")

            booking = Booking.objects.create(
                salon_id=salon_id,
                service=service,
                customer_name=customer_name,
                customer_phone=customer_phone,
                customer_email=customer_email,
                start_at=start_at,
                end_at=end_at,
                meta=meta or {},
            )

            try:
                send_confirmation_sms.delay(booking.id)
            except Exception:
                try:
                    provider = get_sms_provider()
                    provider.send_sms(customer_phone, f"Booking confirmed at {start_at.isoformat()}")
                except Exception as e:
                    logger.exception("Failed to send confirmation (fallback): %s", e)

            return booking
    finally:
        try:
            _release_lock(key, token)
        except Exception:
            logger.exception("Error releasing lock for key=%s", key)


def _can_customer_modify_booking(booking, now=None):
    now = now or timezone.now()
    if booking.status not in ["pending", "confirmed"]:
        return False
    return (booking.start_at - now) >= timedelta(hours=24)


def cancel_booking_by_customer(booking, customer_phone=None, customer_name=None):
    if customer_phone and booking.customer_phone != customer_phone:
        raise BookingOwnershipMismatch("permission denied")
    if customer_name and booking.customer_name != customer_name and booking.customer_phone != customer_phone:
        raise BookingOwnershipMismatch("permission denied")

    if booking.status == "cancelled":
        raise BookingModificationWindowClosed("این نوبت قبلاً لغو شده است")

    if not _can_customer_modify_booking(booking):
        raise BookingModificationWindowClosed("لغو نوبت فقط تا 24 ساعت قبل از شروع امکان‌پذیر است")

    booking.status = "cancelled"
    booking.save(update_fields=["status"])
    return booking