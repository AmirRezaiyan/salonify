# Generated migration for adding address field to Salon

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shops', '0002_salon_disable_reason_salon_disabled_until_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='salon',
            name='address',
            field=models.TextField(blank=True, help_text='آدرس کامل سالن', null=True),
        ),
    ]
