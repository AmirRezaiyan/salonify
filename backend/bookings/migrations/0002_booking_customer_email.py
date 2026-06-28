# Generated migration for adding customer_email to Booking model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='customer_email',
            field=models.EmailField(blank=True, help_text='ایمیل مشتری برای ارسال تایید', max_length=254, null=True),
        ),
    ]
