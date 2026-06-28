from django.urls import path
from .views import ServiceListCreateView, ServiceRetrieveUpdateView, CustomerBookingsView, DayOfWeekCalculatorView
from .views import (
    ServiceListCreateView,
    ServiceRetrieveUpdateView,
    CustomerBookingsView,
    DayOfWeekCalculatorView,
    BookingActionAPIView,
)
app_name = "bookings"

urlpatterns = [
    path("my-bookings/", CustomerBookingsView.as_view(), name="customer-bookings"),
    path("calculate-day-of-week/", DayOfWeekCalculatorView.as_view(), name="calculate-day-of-week"),
    path("services/", ServiceListCreateView.as_view(), name="service-list"),
    path("services/<int:pk>/", ServiceRetrieveUpdateView.as_view(), name="service-detail"),
    path("my-bookings/", CustomerBookingsView.as_view(), name="customer-bookings"),
    path("calculate-day-of-week/", DayOfWeekCalculatorView.as_view(), name="calculate-day-of-week"),
    path("services/", ServiceListCreateView.as_view(), name="service-list"),
    path("services/<int:pk>/", ServiceRetrieveUpdateView.as_view(), name="service-detail"),
    path("tenants/<int:salon_id>/bookings/<int:booking_id>/<str:action>/", BookingActionAPIView.as_view(), name="booking-action"),
]
