from django.db import models
from django.db.models import JSONField
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class Salon(models.Model):
    GENDER_CHOICES = (('male', 'مردانه'), ('female', 'زنانه'))
    
    id = models.AutoField(primary_key=True)
    qr_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, help_text='QR کد منحصربه‌فرد برای سالن')
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=255, unique=True, null=True, blank=True)
    logo_url = models.URLField(null=True, blank=True)
    theme_color = models.CharField(max_length=7, default='#ff5500')
    phone = models.CharField(max_length=12, blank=True, null=True, help_text='تلفن ثابت سالن (اختیاری)')
    mobile = models.CharField(max_length=12, unique=True, null=True, blank=True, help_text='شماره موبایل سالن (از ثبت‌نام مالک گرفته می‌شود)')
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True, help_text='آدرس کامل سالن')
    host = models.CharField(max_length=255, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    settings = models.JSONField(default=dict, blank=True)
    
    owner_image = models.ImageField(upload_to='salon_owners/%Y/%m/%d/', null=True, blank=True, help_text='عکس مالک سالن')
    owner_description = models.TextField(blank=True, null=True, help_text='توضیح درباره مالک سالن')
    
    is_active = models.BooleanField(default=True, help_text='وضعیت سالن')
    disabled_until = models.DateTimeField(null=True, blank=True, help_text='سالن تا این تاریخ غیرفعال است')
    disable_reason = models.TextField(blank=True, null=True, help_text='دلیل غیرفعال شدن سالن')


    def __str__(self):
        return self.name
    
    def is_currently_disabled(self):
        if not self.is_active:
            return True
        if self.disabled_until and self.disabled_until > timezone.now():
            return True
        return False


class SalonWorkingHours(models.Model):
    DAYS_OF_WEEK = (
        (0, 'شنبه'),
        (1, 'یکشنبه'),
        (2, 'دوشنبه'),
        (3, 'سه‌شنبه'),
        (4, 'چهارشنبه'),
        (5, 'پنج‌شنبه'),
        (6, 'جمعه'),
    )

    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='working_hours')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)  # 0=Saturday, 1=Sunday, ..., 6=Friday
    start_time = models.TimeField()  # مثال: 10:00
    end_time = models.TimeField()    # مثال: 14:00
    sort_order = models.PositiveSmallIntegerField(default=0, help_text='ترتیب نمایش شیفت در همان روز')

    class Meta:
        unique_together = ('salon', 'day_of_week', 'start_time', 'end_time')
        ordering = ['day_of_week', 'sort_order', 'start_time']

    def __str__(self):
        return f"{self.get_day_of_week_display()} {self.start_time}-{self.end_time}"

class Service(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=200)
    duration_minutes = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['salon', 'name'],
                condition=models.Q(is_active=True),
                name='unique_active_service_name_per_salon',
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.salon})"


class Review(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner_reply = models.TextField(blank=True, null=True)
    owner_reply_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review {self.rating} by {self.user} on {self.salon}"


class PortfolioCategory(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='portfolio_categories')
    name = models.CharField(max_length=100)  # مثلاً: "اصلاح مو"
    description = models.TextField(blank=True, null=True)
    order = models.PositiveSmallIntegerField(default=0)  # برای ترتیب نمایش
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('salon', 'name')
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.salon} - {self.name}"


class PortfolioItem(models.Model):
    category = models.ForeignKey(PortfolioCategory, on_delete=models.CASCADE, related_name='items')
    title = models.CharField(max_length=50)  # عنوان برای نمونه کار
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='portfolio/%Y/%m/%d/')
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return f"{self.category.name} - {self.title}"