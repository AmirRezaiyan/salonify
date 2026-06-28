from django.contrib import admin
from .models import Booking
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils import timezone


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_info", "service_info", "start_at", "status_display", "salon", "duration", "created_at")
    search_fields = ("customer_name", "customer_phone", "service__name", "salon__name")
    list_filter = ("status", "created_at", "start_at", "salon__city")
    readonly_fields = ("created_at", "booking_details")
    fieldsets = (
        ("اطلاعات مشتری", {"fields": ("customer_name", "customer_phone")}),
        ("اطلاعات رزرو", {"fields": ("salon", "service", "start_at", "end_at")}),
        ("وضعیت", {"fields": ("status", "meta")}),
        ("سابقه", {"fields": ("created_at",)}),
    )
    actions = ["confirm_bookings", "cancel_bookings", "delete_old_bookings"]
    list_per_page = 50
    date_hierarchy = "start_at"

    def customer_info(self, obj):
        return format_html(
            '<strong>{}</strong><br/><small style="color:gray;">{}</small>',
            obj.customer_name,
            obj.customer_phone
        )
    customer_info.short_description = "مشتری"

    def service_info(self, obj):
        return format_html(
            '<strong>{}</strong><br/><small>{} دقیقه</small>',
            obj.service.name,
            obj.service.duration_minutes
        )
    service_info.short_description = "خدمت"

    def status_display(self, obj):
        colors = {
            'pending': 'orange',
            'confirmed': 'green',
            'cancelled': 'red'
        }
        status_fa = {
            'pending': 'در انتظار',
            'confirmed': 'تأیید شده',
            'cancelled': 'لغو شده'
        }
        color = colors.get(obj.status, 'gray')
        fa_status = status_fa.get(obj.status, obj.status)
        return format_html(
            '<span style="background-color:{}; color:white; padding:5px 10px; border-radius:3px;">{}</span>',
            color,
            fa_status
        )
    status_display.short_description = "وضعیت"

    def duration(self, obj):
        duration = (obj.end_at - obj.start_at).total_seconds() / 60
        return f"{int(duration)} دقیقه"
    duration.short_description = "مدت زمان"

    def booking_details(self, obj):
        return format_html(
            '''
            <div style="background:f0f0f0; padding:10px; border-radius:5px;">
                <p><strong>شماره رزرو:</strong> #{}</p>
                <p><strong>مشتری:</strong> {} ({})</p>
                <p><strong>سالن:</strong> {}</p>
                <p><strong>خدمت:</strong> {} ({} دقیقه)</p>
                <p><strong>زمان شروع:</strong> {}</p>
                <p><strong>زمان پایان:</strong> {}</p>
                <p><strong>وضعیت:</strong> {}</p>
            </div>
            ''',
            obj.id,
            obj.customer_name,
            obj.customer_phone,
            obj.salon.name,
            obj.service.name,
            obj.service.duration_minutes,
            obj.start_at.strftime("%Y-%m-%d %H:%M"),
            obj.end_at.strftime("%Y-%m-%d %H:%M"),
            obj.status
        )
    booking_details.short_description = "جزئیات کامل رزرو"

    def confirm_bookings(self, request, queryset):
        count = queryset.update(status='confirmed')
        self.message_user(request, f"{count} رزرو تأیید شد.")
    confirm_bookings.short_description = "تأیید رزروهای انتخاب‌شده"

    def cancel_bookings(self, request, queryset):
        count = queryset.update(status='cancelled')
        self.message_user(request, f"{count} رزرو لغو شد.")
    cancel_bookings.short_description = "لغو رزروهای انتخاب‌شده"

    def delete_old_bookings(self, request, queryset):
        """حذف رزروهای قدیمی"""
        old_bookings = queryset.filter(start_at__lt=timezone.now())
        count = old_bookings.count()
        old_bookings.delete()
        self.message_user(request, f"{count} رزروی قدیمی حذف شد.")
    delete_old_bookings.short_description = "حذف رزروهای منقضی"

    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
