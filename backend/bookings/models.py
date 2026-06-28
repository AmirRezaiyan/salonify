from django.db import models
from django.utils import timezone
from shops.models import Salon, Service


class Booking(models.Model):
    STATUS_CHOICES = (('pending','pending'),('confirmed','confirmed'),('cancelled','cancelled'))
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.PROTECT)
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=11)
    customer_email = models.EmailField(blank=False, null=False, default='', help_text='ایمیل مشتری برای ارسال تایید')
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [models.Index(fields=['salon','start_at','end_at']),]


    def __str__(self):
        return f"Booking {self.id} {self.service} at {self.start_at}"
    
