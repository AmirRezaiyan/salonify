import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "salonify_backend.settings")

app = Celery("salonify")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
