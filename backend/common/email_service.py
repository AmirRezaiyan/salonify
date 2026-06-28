from datetime import datetime
import logging

import jdatetime
import pytz
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def convert_gregorian_to_jalali(gregorian_date):
    """تبدیل تاریخ میلادی به خورشیدی"""
    try:
        if isinstance(gregorian_date, str):
            gregorian_date = datetime.fromisoformat(gregorian_date.replace("Z", "+00:00"))

        if isinstance(gregorian_date, datetime):
            gregorian_date = gregorian_date.date()

        j_date = jdatetime.date.fromgregorian(date=gregorian_date)
        month_names = [
            "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
        ]
        day_names = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]

        month_name = month_names[j_date.month - 1]
        day_name = day_names[j_date.isoweekday() % 7]
        return f"{day_name} {j_date.day} {month_name} {j_date.year}"
    except Exception as e:
        logger.error("Error converting date: %s", e)
        return str(gregorian_date)


def send_password_reset_email(user, reset_url):
    """ارسال ایمیل بازیابی رمز عبور به ایمیل ثبت‌شده‌ی کاربر"""
    try:
        subject = "Salonify | بازیابی رمز عبور"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None) or getattr(settings, "EMAIL_HOST_USER", None) or "noreply@salonify.local"

        html_message = f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    background-color: #f5f7fa;
                    margin: 0;
                    padding: 0;
                    color: #1e293b;
                }}
                .wrapper {{
                    max-width: 640px;
                    margin: 0 auto;
                    padding: 24px 16px;
                }}
                .card {{
                    background: #ffffff;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.10);
                    border: 1px solid #e2e8f0;
                }}
                .hero {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 36px 28px;
                    text-align: center;
                }}
                .brand-badge {{
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.16);
                    border: 1px solid rgba(255,255,255,0.22);
                    padding: 8px 14px;
                    border-radius: 999px;
                    font-weight: 700;
                    margin-bottom: 16px;
                }}
                .hero h1 {{
                    margin: 0;
                    font-size: 30px;
                    line-height: 1.2;
                }}
                .content {{
                    padding: 32px 28px 28px;
                }}
                .text {{
                    font-size: 15px;
                    line-height: 1.9;
                    color: #334155;
                    margin: 0 0 16px;
                }}
                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    font-weight: 700;
                    padding: 13px 28px;
                    border-radius: 12px;
                    margin: 18px 0 10px;
                }}
                .hint {{
                    background: #eff6ff;
                    border-right: 4px solid #3b82f6;
                    padding: 14px 16px;
                    border-radius: 12px;
                    color: #1e3a8a;
                    margin: 20px 0;
                    font-size: 14px;
                    line-height: 1.8;
                }}
                .link {{
                    word-break: break-all;
                    color: #4f46e5;
                    font-size: 13px;
                    direction: ltr;
                    text-align: left;
                }}
                .footer {{
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 12px;
                    text-align: center;
                    padding: 18px 20px;
                }}
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="card">
                    <div class="hero">
                        <div class="brand-badge">Salonify</div>
                        <h1>بازیابی رمز عبور</h1>
                    </div>

                    <div class="content">
                        <p class="text">سلام {user.first_name or user.username} عزیز،</p>
                        <p class="text">
                            برای حساب شما در Salonify درخواست بازیابی رمز عبور ثبت شده است.
                            برای تعیین رمز جدید، روی دکمه زیر کلیک کنید.
                        </p>

                        <div style="text-align:center;">
                            <a class="button" href="{reset_url}">تغییر رمز عبور</a>
                        </div>

                        <div class="hint">
                            اگر این درخواست را شما ثبت نکرده‌اید، این ایمیل را نادیده بگیرید و رمز عبور خود را تغییر ندهید.
                        </div>

                        <p class="text" style="margin-bottom: 8px;">اگر دکمه کار نکرد، این لینک را باز کنید:</p>
                        <p class="link">{reset_url}</p>
                    </div>

                    <div class="footer">
                        این ایمیل به‌صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info("Password reset email sent successfully to %s", user.email)
        return True
    except Exception as e:
        logger.error(
            "Error sending password reset email for user %s: %s",
            getattr(user, "id", None),
            str(e),
        )
        return False


def send_booking_confirmation_email(booking):
    """
    ارسال ایمیل تایید رزرو به مشتری
    """
    try:
        customer_email = booking.customer_email if hasattr(booking, 'customer_email') else None

        if not customer_email:
            logger.warning(f"Booking {booking.id} has no customer_email")
            return False

        salon = booking.salon
        service = booking.service
        start_time = booking.start_at

        if timezone.is_naive(start_time):
            start_time = timezone.make_aware(start_time, timezone.utc)

        tehran_tz = pytz.timezone('Asia/Tehran')
        localized_time = start_time.astimezone(tehran_tz)

        jalali_date = convert_gregorian_to_jalali(localized_time)
        time_str = localized_time.strftime('%H:%M')

        service_duration = service.duration_minutes if hasattr(service, 'duration_minutes') else 30

        meta = booking.meta or {}
        multiple_services = meta.get('services', [])

        if multiple_services and len(multiple_services) > 1:
            service_names = ' + '.join([s.get('name', '') for s in multiple_services])
            service_duration = sum([s.get('duration_minutes', 0) for s in multiple_services])
        else:
            service_names = service.name

        context = {
            'salon_name': salon.name,
            'customer_name': booking.customer_name,
            'jalali_date': jalali_date,
            'time': time_str,
            'service_name': service_names,
            'salon_address': salon.address or 'آدرس در دسترس نیست',
            'salon_phone': salon.phone or salon.mobile or 'شماره تلفن در دسترس نیست',
            'service_duration': service_duration,
        }

        html_message = f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    background-color: #f5f7fa;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }}
                .content {{
                    padding: 40px;
                    direction: rtl;
                }}
                .status {{
                    background-color: #d1fae5;
                    border-right: 4px solid #10b981;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    text-align: right;
                }}
                .status p {{
                    margin: 0;
                    color: #065f46;
                    font-weight: 600;
                    font-size: 16px;
                }}
                .section {{
                    margin-bottom: 30px;
                }}
                .section-title {{
                    color: #1e293b;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }}
                .detail-box {{
                    background-color: #f8fafc;
                    border-right: 3px solid #667eea;
                    padding: 12px 16px;
                    margin-bottom: 12px;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
                .detail-label {{
                    color: #64748b;
                    font-size: 14px;
                    font-weight: 600;
                }}
                .detail-value {{
                    color: #1e293b;
                    font-size: 16px;
                    font-weight: 700;
                }}
                .appointment-details {{
                    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 20px 0;
                }}
                .appointment-detail {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #e2e8f0;
                }}
                .appointment-detail:last-child {{
                    border-bottom: none;
                }}
                .appointment-label {{
                    color: #64748b;
                    font-size: 14px;
                    font-weight: 500;
                }}
                .appointment-value {{
                    color: #1e293b;
                    font-size: 16px;
                    font-weight: 700;
                }}
                .alert {{
                    background-color: #fef3c7;
                    border-right: 4px solid #f59e0b;
                    padding: 16px;
                    border-radius: 8px;
                    margin: 20px 0;
                    color: #92400e;
                    font-size: 14px;
                }}
                .footer {{
                    background-color: #f8fafc;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 12px;
                }}
                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 32px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ نوبت تایید شد</h1>
                </div>

                <div class="content">
                    <div class="status">
                        <p>📅 نوبت شما با موفقیت تایید شده است</p>
                    </div>

                    <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">
                        سلام {context['customer_name']} عزیز،
                    </p>

                    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
                        از اینکه نوبت خود را در <strong>{context['salon_name']}</strong> رزرو کردید متشکریم.
                        نوبت شما تایید شده است و منتظر حضورتان هستیم.
                    </p>

                    <div class="appointment-details">
                        <div class="appointment-detail">
                            <span class="appointment-label">📅 تاریخ نوبت:</span>
                            <span class="appointment-value">{context['jalali_date']}</span>
                        </div>
                        <div class="appointment-detail">
                            <span class="appointment-label">⏰ ساعت حضور:</span>
                            <span class="appointment-value">{context['time']}</span>
                        </div>
                        <div class="appointment-detail">
                            <span class="appointment-label">✂️ خدمت:</span>
                            <span class="appointment-value">{context['service_name']}</span>
                        </div>
                        <div class="appointment-detail">
                            <span class="appointment-label">⏱️ مدت زمان:</span>
                            <span class="appointment-value">{context['service_duration']} دقیقه</span>
                        </div>
                    </div>

                    <div class="section">
                        <h3 class="section-title">📍 اطلاعات سالن</h3>

                        <div class="detail-box">
                            <span class="detail-label">نام سالن:</span>
                            <span class="detail-value">{context['salon_name']}</span>
                        </div>

                        <div class="detail-box">
                            <span class="detail-label">آدرس:</span>
                            <span class="detail-value">{context['salon_address']}</span>
                        </div>

                        <div class="detail-box">
                            <span class="detail-label">تلفن سالن:</span>
                            <span class="detail-value">{context['salon_phone']}</span>
                        </div>
                    </div>

                    <div class="alert">
                        <strong>⚠️ مهم:</strong> لطفا ۵ دقیقه قبل از ساعت مقرر در سالن حاضر شوید.
                        در صورت نیاز برای لغو یا تغییر وقت، با سالن تماس بگیرید.
                    </div>

                    <p style="color: #475569; text-align: center; margin-top: 30px; font-size: 14px;">
                        با تشکر از انتخاب خدمات ما، امیدواریم که از خدمات ما رضایت بخش باشید.
                    </p>
                </div>

                <div class="footer">
                    <p style="margin: 0;">
                        این ایمیل به طور خودکار ارسال شده است. لطفا پاسخ ندهید.
                    </p>
                    <p style="margin: 10px 0 0 0;">
                        © 2026 Salonify. تمام حقوق محفوظ است.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        plain_message = strip_tags(html_message)

        send_mail(
            subject=f'✓ تایید نوبت شما در {salon.name}',
            message=plain_message,
            from_email='noreply@salonify.com',
            recipient_list=[customer_email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Confirmation email sent successfully for booking {booking.id} to {customer_email}")
        return True

    except Exception as e:
        logger.error(f"Error sending confirmation email for booking {booking.id}: {str(e)}")
        return False