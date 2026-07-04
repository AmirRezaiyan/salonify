from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Salon, Service
from .serializers import ServiceSerializer


class ServiceValidationTests(TestCase):
    def test_service_serializer_rejects_zero_price(self):
        serializer = ServiceSerializer(data={
            'name': 'اصلاح مو',
            'price': 0,
            'duration_minutes': 30,
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('price', serializer.errors)

    def test_public_service_list_hides_free_or_inactive_services(self):
        salon = Salon.objects.create(name='سالن تست', mobile='09910000000')
        Service.objects.create(salon=salon, name='سرویس رایگان', price=Decimal('0.00'), duration_minutes=30, is_active=True)
        Service.objects.create(salon=salon, name='سرویس غیرفعال', price=Decimal('100000.00'), duration_minutes=30, is_active=False)
        Service.objects.create(salon=salon, name='سرویس فعال', price=Decimal('100000.00'), duration_minutes=30, is_active=True)

        client = APIClient()
        url = reverse('shops:tenant-services', kwargs={'salon_id': salon.id})
        response = client.get(url)

        self.assertEqual(response.status_code, 200)
        names = [item['name'] for item in response.data]
        self.assertEqual(names, ['سرویس فعال'])
