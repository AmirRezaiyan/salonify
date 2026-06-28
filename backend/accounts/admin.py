from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.html import format_html
from django.utils.safestring import mark_safe

User = get_user_model()

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("اطلاعات اضافی", {"fields": ("role", "phone_number", "salon")}),
    )
    list_display = ("username", "email", "role_display", "salon", "phone_number", "is_staff", "is_active", "user_status")
    search_fields = ("username", "email", "phone_number", "salon__name")
    list_filter = ("role", "is_staff", "is_active", "date_joined")
    actions = ["activate_users", "deactivate_users", "make_staff", "remove_staff"]
    list_per_page = 50

    def role_display(self, obj):
        colors = {
            'owner': '#4CAF50',
            'staff': '#2196F3',
            'customer': '#9C27B0'
        }
        role_fa = {
            'owner': 'صاحب سالن',
            'staff': 'کارمند',
            'customer': 'مشتری'
        }
        color = colors.get(obj.role, 'gray')
        fa_role = role_fa.get(obj.role, obj.role)
        return format_html(
            '<span style="background-color:{}; color:white; padding:5px 10px; border-radius:3px;">{}</span>',
            color,
            fa_role
        )
    role_display.short_description = "نقش"

    def user_status(self, obj):
        if obj.is_active:
            return mark_safe('<span style="color:green;">✓ فعال</span>')
        return mark_safe('<span style="color:red;">✗ غیرفعال</span>')
    user_status.short_description = "وضعیت"

    def activate_users(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} کاربر فعال شد.")
    activate_users.short_description = "فعال کردن کاربران انتخاب‌شده"

    def deactivate_users(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} کاربر غیرفعال شد.")
    deactivate_users.short_description = "غیرفعال کردن کاربران انتخاب‌شده"

    def make_staff(self, request, queryset):
        count = queryset.update(is_staff=True)
        self.message_user(request, f"{count} کاربر به عنوان کارمند تعیین شد.")
    make_staff.short_description = "تعیین به عنوان کارمند"

    def remove_staff(self, request, queryset):
        count = queryset.update(is_staff=False)
        self.message_user(request, f"{count} کاربر از کارمندی حذف شد.")
    remove_staff.short_description = "حذف از کارمندی"

    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
