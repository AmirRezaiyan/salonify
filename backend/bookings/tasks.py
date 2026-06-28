from celery import shared_task
import logging

from bookings.models import Booking
from common.sms_service import get_sms_provider

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_confirmation_sms(self, booking_id):
    try:
        booking = Booking.objects.select_related("salon").get(pk=booking_id)
    except Booking.DoesNotExist:
        logger.warning("Booking %s not found for SMS", booking_id)
        return

    # check consent flag in meta
    sms_consent = booking.meta.get("sms_consent", True)
    if not sms_consent:
        logger.info("Booking %s: sms_consent false, skipping SMS", booking_id)
        return

    meta = booking.meta or {}
    multiple_services = meta.get('services', [])
    
    if multiple_services and len(multiple_services) > 1:
        service_names = ' + '.join([s.get('name', '') for s in multiple_services])
    else:
        service_names = booking.service.name

    provider = get_sms_provider()
    body = f"رزرو شما برای {service_names} در تاریخ {booking.start_at.isoformat()} ثبت شد. (id: {booking.id})"
    try:
        provider.send_sms(booking.customer_phone, body)
        logger.info("Confirmation SMS enqueued/sent for booking %s", booking_id)
    except Exception as exc:
        logger.exception("Failed to send SMS for booking %s: %s", booking_id, exc)
        raise self.retry(exc=exc)
