from django.utils.deprecation import MiddlewareMixin
from shops.models import Salon
import logging

logger = logging.getLogger(__name__)


class TenantMiddleware(MiddlewareMixin):
    """
    Attach request.salon (SaaS tenant) for multi-tenant isolation.
    Priority:
    1. ?host= query param (development)
    2. X-Salon-Host header (API / frontend calls)
    3. request.get_host() (real DNS)
    """
    def process_request(self, request):
        # Extract host from query / header / server host
        host = (
            request.GET.get('host')
            or request.headers.get('X-Salon-Host')
            or request.get_host()
        )

        # Remove port if present
        host = host.split(':')[0] if host else None

        try:
            salon = Salon.objects.filter(domain__iexact=host).first() if host else None
            if salon:
                logger.debug("Tenant attached: salon_id=%s, host=%s", salon.id, host)
            else:
                logger.debug("No tenant found for host=%s", host)
        except Exception as e:
            logger.exception("Error attaching tenant from host=%s: %s", host, str(e))
            salon = None

        # Attach to request for use in views
        request.salon = salon
