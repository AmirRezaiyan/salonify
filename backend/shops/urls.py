from django.urls import path
from .views import (
    ServiceListView, CurrentTenantAPIView, SalonDetailView, SalonListView, 
    ServiceManageViewSet, StatsAPIView, SalonWorkingHoursViewSet, WorkingHoursListView, 
    ToggleSalonStatusAPIView, SalonUpdateView,
    ReviewListCreateView, OwnerReplyAPIView,
    PortfolioCategoryListCreateView, PortfolioCategoryDetailView,
    PortfolioItemListCreateView, PortfolioItemDetailView,
    SalonByQRCodeView, MyQRCodeView
)
from bookings.views import BookingListCreateView, BookingActionAPIView, DayOfWeekCalculatorView
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'services/manage', ServiceManageViewSet, basename='service-manage')
router.register(r'working-hours', SalonWorkingHoursViewSet, basename='working-hours')
app_name = "shops"

urlpatterns = [
    path("salons/", SalonListView.as_view(), name="salon-list"),
    path("salons/<int:pk>/", SalonDetailView.as_view(), name="salon-detail"),
    path("salons/<int:pk>/update/", SalonUpdateView.as_view(), name="salon-update"),
    path("tenants/<int:salon_id>/services/", ServiceListView.as_view(), name="tenant-services"),
    path("tenants/<int:salon_id>/working-hours/", WorkingHoursListView.as_view(), name="tenant-working-hours"),
    path("tenants/<int:salon_id>/bookings/", BookingListCreateView.as_view(), name="tenant-bookings"),
    path("tenants/<int:salon_id>/bookings/calculate-day-of-week/", DayOfWeekCalculatorView.as_view(), name="calculate-day-of-week"),
    path("tenants/<int:salon_id>/bookings/<int:booking_id>/<str:action>/", BookingActionAPIView.as_view(), name="booking-action"),
    path("tenant/", CurrentTenantAPIView.as_view(), name="current-tenant"),
    path("stats/", StatsAPIView.as_view(), name="platform-stats"),
    path("tenants/<int:pk>/", SalonDetailView.as_view(), name="tenant-detail"),
    path("salon-status/toggle/", ToggleSalonStatusAPIView.as_view(), name="toggle-salon-status"),
    
    # Reviews
    path("tenants/<int:salon_id>/reviews/", ReviewListCreateView.as_view(), name="tenant-reviews"),
    path("tenants/<int:salon_id>/reviews/<int:review_id>/reply/", OwnerReplyAPIView.as_view(), name="review-reply"),
    
    # Portfolio
    path("tenants/<int:salon_id>/portfolio/", PortfolioCategoryListCreateView.as_view(), name="portfolio-categories"),
    path("portfolio/categories/<int:pk>/", PortfolioCategoryDetailView.as_view(), name="portfolio-category-detail"),
    path("portfolio/categories/<int:category_id>/items/", PortfolioItemListCreateView.as_view(), name="portfolio-items"),
    path("portfolio/items/<int:pk>/", PortfolioItemDetailView.as_view(), name="portfolio-item-detail"),
    
    # QR Code
    path("salons/qr/<str:qr_code>/", SalonByQRCodeView.as_view(), name="salon-by-qr"),
    path("my-salon/qr-code/", MyQRCodeView.as_view(), name="my-qr-code"),
]
urlpatterns += router.urls

