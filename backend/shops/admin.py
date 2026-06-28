from django.contrib import admin
from .models import Salon, Service
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db.models import Count
from django.contrib import messages
from django.db.models.deletion import ProtectedError


class ServiceInline(admin.TabularInline):
    model = Service
    extra = 0
    fields = ("name", "duration_minutes", "price", "is_active")
    show_change_link = True


@admin.register(Salon)
class SalonAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "city", "domain", "phone", "logo_preview_small", "theme_color", "services_count", "bookings_count", "active_status")
    search_fields = ("name", "domain", "city", "phone", "host")
    list_filter = ("city", "theme_color")
    inlines = [ServiceInline]
    fieldsets = (
        ("اطلاعات پایه", {"fields": ("name", "domain", "host", "phone", "city")}),
        ("ظاهر", {"fields": ("logo_url", "logo_preview", "theme_color")}),
        ("تنظیمات", {"fields": ("settings",)}),
    )
    readonly_fields = ("logo_preview",)
    actions = ["delete_selected_salons", "export_salon_data"]
    list_per_page = 25

    def logo_preview_small(self, obj):
        if obj.logo_url:
            return format_html('<img src="{}" style="height:30px; border-radius:3px;" />', obj.logo_url)
        return "-"
    logo_preview_small.short_description = "لوگو"

    def logo_preview(self, obj):
        if obj.logo_url:
            return format_html('<img src="{}" style="height:100px; border-radius:5px;" />', obj.logo_url)
        return "لوگویی موجود نیست"
    logo_preview.short_description = "پیش‌نمایش لوگو"

    def services_count(self, obj):
        count = obj.services.count()
        return format_html('{} <span style="color:green;">✓</span>', count)
    services_count.short_description = "تعداد خدمات"

    def bookings_count(self, obj):
        from bookings.models import Booking
        count = Booking.objects.filter(salon=obj).count()
        return format_html('{} <span style="color:blue;">📋</span>', count)
    bookings_count.short_description = "تعداد رزرو"

    def active_status(self, obj):
        return mark_safe('<span style="color:green; font-weight:bold;">✓ فعال</span>')
    active_status.short_description = "وضعیت"

    def delete_selected_salons(self, request, queryset):
        """حذف سالن‌های انتخاب‌شده"""
        try:
            count = queryset.count()
            queryset.delete()
            self.message_user(request, f"{count} سالن با موفقیت حذف شد.")
        except ProtectedError as e:
            # Provide a clearer admin-facing message when related protected objects prevent deletion
            related = None
            try:
                related = e.protected_objects
            except Exception:
                related = e.args[1] if len(e.args) > 1 else None

            # Count bookings (or other protected instances) to give the admin useful info
            related_count = 0
            if related:
                for obj in related:
                    # defensive: some proxies may be querysets or sets
                    try:
                        if hasattr(obj, '__class__') and obj.__class__.__name__ == 'Booking':
                            related_count += 1
                    except Exception:
                        continue

            msg = (
                "حذف انجام نشد — برخی اشیاء محافظت‌شده وجود دارند. "
                "احتمالاً رزروهایی به خدمات این سالن‌ها متصل هستند. "
                "ابتدا رزروها را حذف یا انتقال دهید و سپس دوباره تلاش کنید."
            )
            if related_count:
                msg = f"{msg} ({related_count} رزرو محافظت‌شده یافت شد.)"
            self.message_user(request, msg, level=messages.ERROR)
    delete_selected_salons.short_description = "حذف سالن‌های انتخاب‌شده"

    def export_salon_data(self, request, queryset):
        """خروجی اطلاعات سالن"""
        self.message_user(request, f"{queryset.count()} سالن برای خروجی آماده‌شد.")
    export_salon_data.short_description = "خروجی داده سالن"

    def get_queryset(self, request):
        """بهتر‌سازی کارایی"""
        qs = super().get_queryset(request)
        return qs

    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        """اجازه حذف برای همه ادمین‌ها"""
        return True
    
    def has_view_permission(self, request, obj=None):
        return True



@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "salon", "duration_minutes", "price", "is_active", "created_at", "booking_count")
    search_fields = ("name", "salon__name", "salon__city")
    list_filter = ("is_active", "duration_minutes", "created_at", "salon__city")
    list_editable = ("price", "is_active")
    readonly_fields = ("created_at",)
    fieldsets = (
        ("اطلاعات خدمت", {"fields": ("salon", "name", "duration_minutes", "price")}),
        ("وضعیت", {"fields": ("is_active", "created_at")}),
    )
    actions = ["activate_services", "deactivate_services", "delete_selected_services"]
    list_per_page = 50

    def booking_count(self, obj):
        from bookings.models import Booking
        count = Booking.objects.filter(service=obj).count()
        return format_html('{} <span style="color:purple;">📊</span>', count)
    booking_count.short_description = "تعداد رزرو"

    def activate_services(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} خدمت فعال شد.")
    activate_services.short_description = "فعال کردن خدمات انتخاب‌شده"

    def deactivate_services(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} خدمت غیرفعال شد.")
    deactivate_services.short_description = "غیرفعال کردن خدمات انتخاب‌شده"

    def delete_selected_services(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} خدمت با موفقیت حذف شد.")
    delete_selected_services.short_description = "حذف خدمات انتخاب‌شده"

    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        """اجازه حذف برای همه ادمین‌ها"""
        return True
    
    def has_view_permission(self, request, obj=None):
        return True


# Portfolio Admin Classes
from .models import PortfolioCategory, PortfolioItem


class PortfolioItemInline(admin.TabularInline):
    model = PortfolioItem
    extra = 0
    fields = ("title", "description", "image", "order")
    show_change_link = True


@admin.register(PortfolioCategory)
class PortfolioCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "salon", "order", "items_count", "created_at")
    search_fields = ("name", "salon__name")
    list_filter = ("created_at", "salon__name")
    list_editable = ("order",)
    readonly_fields = ("created_at",)
    inlines = [PortfolioItemInline]
    fieldsets = (
        ("اطلاعات دسته‌بندی", {"fields": ("salon", "name", "description", "order")}),
        ("سایر", {"fields": ("created_at",)}),
    )
    
    def items_count(self, obj):
        count = obj.items.count()
        return format_html('{} عکس', count)
    items_count.short_description = "تعداد عکس"


@admin.register(PortfolioItem)
class PortfolioItemAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "image_preview", "order", "created_at")
    search_fields = ("title", "category__name", "category__salon__name")
    list_filter = ("created_at", "category__salon__name")
    list_editable = ("order",)
    readonly_fields = ("created_at", "image_preview_large")
    fieldsets = (
        ("اطلاعات نمونه کار", {"fields": ("category", "title", "description", "image")}),
        ("پیش‌نمایش", {"fields": ("image_preview_large",)}),
        ("ترتیب", {"fields": ("order",)}),
        ("سایر", {"fields": ("created_at",)}),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px; border-radius:3px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "عکس"
    
    def image_preview_large(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:300px; border-radius:5px;" />', obj.image.url)
        return "عکسی موجود نیست"
    image_preview_large.short_description = "پیش‌نمایش عکس"
