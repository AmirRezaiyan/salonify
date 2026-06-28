from django.db import models
from django.contrib.auth.models import AbstractUser
from .constants import IRAN_CITIES

class User(AbstractUser):
    ROLE_CHOICES = (('owner','owner'), ('staff','staff'), ('customer','customer'))
    GENDER_CHOICES = (('male', 'مردانه'), ('female', 'زنانه'), ('other', 'دیگر'))
    city = models.CharField(max_length=50, choices=IRAN_CITIES, blank=True, default='')
    email = models.EmailField(unique=True)  # ایمیل منحصربفرد
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone_number = models.CharField(max_length=20, blank=True, default='', unique=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, default='other')
    salon = models.ForeignKey('shops.Salon', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.username} ({self.role})"