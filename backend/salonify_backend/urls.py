from django.contrib import admin
from django.urls import path, include
from shops.views import ServiceManagementViewSet
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'admin/services', ServiceManagementViewSet, basename='service-management')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth / Accounts
    path('api/accounts/', include('accounts.urls')),

    # Shops / Tenants (includes bookings for tenants)
    path('api/', include('shops.urls')),

    # Bookings & Services (customer bookings and services management)
    path('api/bookings/', include('bookings.urls')),
]

# mount router under /api/ so admin service management endpoints are namespaced under API
urlpatterns += [path('api/', include((router.urls, 'api'), namespace='api'))]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )

    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT
    )
    
    
    
    