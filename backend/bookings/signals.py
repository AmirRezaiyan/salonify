"""
Django signals for bookings app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Booking
from common.email_service import send_booking_confirmation_email
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Booking)
def send_confirmation_email_on_confirm(sender, instance, created, update_fields, **kwargs):
    """
    ارسال ایمیل تایید بعد از تایید رزرو
    """
    if instance.status == 'confirmed':
        if update_fields is None or 'status' in update_fields:
            logger.info(f"Booking {instance.id} confirmed. Sending confirmation email to {instance.customer_email}...")
            try:
                send_booking_confirmation_email(instance)
                logger.info(f"Email sent successfully for booking {instance.id}")
            except Exception as e:
                logger.error(f"Failed to send email for booking {instance.id}: {str(e)}")
