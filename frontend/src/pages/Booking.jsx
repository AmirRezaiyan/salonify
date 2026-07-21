import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { Input } from '../components/Form';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { FieldErrorBox } from '../components/FieldErrorBox';
import { Loading } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { parseISO } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Scissors,
  DollarSign,
  Info,
  CheckCircle,
  Sparkles,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { formatNumberForToman, formatToman, toPersianNumber } from '../utils/formatCurrency';

// ─── کامپوننت دیالوگ عمومی ────────────────────────────────────────────────────
function BookingDialog({ dialog, onClose, language }) {
  if (!dialog) return null;
  const isEnglish = language === 'en';

  const configs = {
    success: {
      icon: <CheckCircle size={52} color="#16a34a" />,
      headerBg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
      headerBorder: '#86efac',
      btnBg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
      btnHover: '#15803d',
      titleColor: '#15803d',
    },
    error: {
      icon: <XCircle size={52} color="#dc2626" />,
      headerBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      headerBorder: '#fca5a5',
      btnBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      btnHover: '#b91c1c',
      titleColor: '#dc2626',
    },
    warning: {
      icon: <AlertTriangle size={52} color="#d97706" />,
      headerBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      headerBorder: '#fcd34d',
      btnBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      btnHover: '#b45309',
      titleColor: '#d97706',
    },
    info: {
      icon: <Info size={52} color="var(--primary)" />,
      headerBg: 'linear-gradient(135deg, var(--surface-accent-strong) 0%, var(--surface-accent) 100%)',
      headerBorder: 'var(--surface-accent-border)',
      btnBg: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
      btnHover: '#5a67d8',
      titleColor: '#5a29c4',
    },
  };

  const cfg = configs[dialog.type] || configs.info;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          direction: isEnglish ? 'ltr' : 'rtl',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--card)',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          }}
        >
          {/* هدر رنگی */}
          <div style={{
            background: cfg.headerBg,
            borderBottom: `1px solid ${cfg.headerBorder}`,
            padding: '28px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '14px',
                [isEnglish ? 'right' : 'left']: '14px',
                background: 'rgba(0,0,0,0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: "var(--text-secondary)",
              }}
            >
              <X size={18} />
            </button>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 350 }}
            >
              {cfg.icon}
            </motion.div>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: cfg.titleColor,
              textAlign: 'center',
            }}>
              {dialog.title}
            </h2>
          </div>

          {/* بدنه */}
          <div style={{ padding: '20px 24px 24px' }}>
            <p style={{
              margin: '0 0 20px',
              color: "var(--text-secondary)",
              fontSize: '0.95rem',
              lineHeight: 1.7,
              textAlign: 'center',
            }}>
              {dialog.message}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {dialog.secondaryBtn && (
                <button
                  onClick={dialog.secondaryBtn.action || onClose}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    border: '2px solid var(--border)',
                    borderRadius: '12px',
                    background: 'var(--card)',
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--background-secondary)'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {dialog.secondaryBtn.label}
                </button>
              )}
              <button
                onClick={dialog.primaryBtn?.action || onClose}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: cfg.btnBg,
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {dialog.primaryBtn?.label || 'باشه'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



// شماره تلفن ثبت‌نامی کاربر را از هر فیلدی که backend ممکن است برگرداند استخراج می‌کنیم
const getRegisteredPhone = (u) =>
  u?.phone ||
  u?.phone_number ||
  u?.mobile ||
  u?.mobile_number ||
  u?.customer_phone ||
  u?.tel ||
  u?.profile?.phone ||
  u?.profile?.phone_number ||
  u?.profile?.mobile ||
  u?.profile?.mobile_number ||
  '';

// ایمیل ثبت‌نامی کاربر را از هر فیلدی که backend ممکن است برگرداند استخراج می‌کنیم
const getRegisteredEmail = (u) =>
  u?.email ||
  u?.email_address ||
  u?.customer_email ||
  u?.profile?.email ||
  u?.profile?.email_address ||
  u?.profile?.customer_email ||
  '';

// برای مقایسهٔ شماره‌ها، رقم‌های فارسی/عربی و فاصله‌ها را یکدست می‌کنیم
const normalizePhoneNumber = (phone) =>
  String(phone || '')
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[^\d]/g, '');

// ─── تابع‌های کمکی تقویم شمسی ────────────────────────────────────────────────

// تبدیل تاریخ میلادی به شمسی و برگرداندن { jy, jm, jd }
function toJalali(gy, gm, gd) {
  const g_d_no = [0,31,29,31,30,31,30,31,31,30,31,30,31];
  const j_d_no = [0,31,31,31,31,31,31,30,30,30,30,30,29];
  let jy, jm, jd, g_day_no, j_day_no;
  gy -= 1600; gm -= 1; gd -= 1;
  g_day_no = 365*gy + Math.floor((gy+3)/4) - Math.floor((gy+99)/100) + Math.floor((gy+399)/400);
  for (let i=0; i<gm; ++i) g_day_no += g_d_no[i+1];
  if (gm>1 && ((gy%4===0 && gy%100!==0) || (gy%400===0))) g_day_no++;
  g_day_no += gd;
  j_day_no = g_day_no - 79;
  const j_np = Math.floor(j_day_no/12053); j_day_no %= 12053;
  jy = 979 + 33*j_np + 4*Math.floor(j_day_no/1461);
  j_day_no %= 1461;
  if (j_day_no >= 366) { jy += Math.floor((j_day_no-1)/365); j_day_no = (j_day_no-1)%365; }
  jm = 1; jd = j_day_no + 1;
  for (let i=0; i<11 && j_day_no >= j_d_no[i+1]; ++i) {
    j_day_no -= j_d_no[i+1]; jm = i+2; jd = j_day_no + 1;
  }
  return { jy, jm, jd };
}

// تبدیل تاریخ شمسی به میلادی
function toGregorian(jy, jm, jd) {
  let gy, gm, gd;
  jy += 1595;
  let days = -355779 + 365*jy + Math.floor(jy/33)*8 + Math.floor(((jy%33)+3)/4) + jm<=6 ? (jm-1)*31 : (jm-7)*30+186;
  // ساده‌تر با فرمول استاندارد
  const jy2 = jy - 979;
  const jm2 = jm - 1;
  const jd2 = jd - 1;
  let j_day_no = 365*jy2 + Math.floor(jy2/33)*8 + Math.floor((jy2%33+3)/4);
  for (let i=0; i<jm2; ++i) j_day_no += [31,31,31,31,31,31,30,30,30,30,30,29][i];
  j_day_no += jd2;
  let g_day_no = j_day_no + 79;
  let gy2 = 1600 + 400*Math.floor(g_day_no/146097); g_day_no %= 146097;
  let leap = true;
  if (g_day_no >= 36525) { g_day_no--; gy2 += 100*Math.floor(g_day_no/36524); g_day_no %= 36524; if (g_day_no >= 365) g_day_no++; else leap = false; }
  gy2 += 4*Math.floor(g_day_no/1461); g_day_no %= 1461;
  if (g_day_no >= 366) { leap = false; g_day_no--; gy2 += Math.floor(g_day_no/365); g_day_no %= 365; }
  const g_d_no = [31, leap?29:28,31,30,31,30,31,31,30,31,30,31];
  let gm2;
  for (gm2=0; g_day_no >= g_d_no[gm2]; gm2++) g_day_no -= g_d_no[gm2];
  return new Date(gy2, gm2, g_day_no+1);
}

// تعداد روزهای یک ماه شمسی
function jalaliMonthDays(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // اسفند - بررسی کبیسه
  return (jy%33===1||jy%33===5||jy%33===9||jy%33===13||jy%33===17||jy%33===22||jy%33===26||jy%33===30) ? 30 : 29;
}

// روز اول ماه شمسی چه روز هفته‌ای است؟ (0=شنبه ... 6=جمعه)
function jalaliFirstWeekday(jy, jm) {
  const gDate = toGregorian(jy, jm, 1);
  // JS getDay: 0=Sun, 1=Mon, ..., 6=Sat
  // ما می‌خوایم: 0=Sat, 1=Sun, ..., 6=Fri
  const jsDay = gDate.getDay();
  return (jsDay + 1) % 7; // Sat=0
}

// ─── کامپوننت تقویم شمسی ─────────────────────────────────────────────────────

function JalaliCalendarPicker({ dateOptions, selectedDate, onDateChange, bookedDates, workingHours, onFullDayClick, t, isEnglish }) {
  const jalaliMonthNames = isEnglish
    ? ['Farvardin','Ordibehesht','Khordad','Tir','Mordad','Shahrivar','Mehr','Aban','Azar','Dey','Bahman','Esfand']
    : ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const dayLabels = isEnglish ? ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'] : ['ش','ی','د','س','چ','پ','ج'];

  // ماه و سال جاری شمسی - محاسبه یک‌بار در خارج از render
  const todayJalali = toJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

  const [currentJY, setCurrentJY] = useState(todayJalali.jy);
  const [currentJM, setCurrentJM] = useState(todayJalali.jm);

  // مجموعه تاریخ‌های در دسترس (کلیدشان dateStr از getDateStringFromJalali هست: "1404-05-03")
  const availableDatesSet = new Set(dateOptions.map(d => d.key));

  // تابع برای بررسی کامل بودن یک روز
  const isDateFull = (dateStr) => {
    if (!availableDatesSet.has(dateStr)) return false; // روز تعطیل است
    
    // پیدا کردن dayOfWeek برای این روز
    const dateOption = dateOptions.find(d => d.key === dateStr);
    if (!dateOption) return false;
    
    // بررسی اینکه آیا نوبتی از کل مدت کاری باقی مانده است
    const ourWeekday = dateOption.dayOfWeek;
    const dayWorkingHours = workingHours.filter(wh => wh.day_of_week === ourWeekday);
    
    if (dayWorkingHours.length === 0) return false;
    
    // بررسی اینکه آیا تمام ساعات کاری رزرو شده است
    const gregorianDate = new Date(dateOption.gregorianDate);
    const STEP_MIN = 30;
    const duration = 30; // مدت پیش‌فرض برای check
    
    let hasAvailableSlot = false;
    
    for (const wh of dayWorkingHours) {
      const [startHour, startMin] = wh.start_time.split(':').map(x => parseInt(x, 10));
      const [endHour, endMin] = wh.end_time.split(':').map(x => parseInt(x, 10));
      
      const startTimeOfDay = new Date(gregorianDate.getFullYear(), gregorianDate.getMonth(), gregorianDate.getDate(), startHour, startMin, 0);
      const endTimeOfDay = new Date(gregorianDate.getFullYear(), gregorianDate.getMonth(), gregorianDate.getDate(), endHour, endMin, 0);
      
      let slotTime = new Date(startTimeOfDay);
      
      while (slotTime.getTime() + (duration * 60000) <= endTimeOfDay.getTime()) {
        const slotStart = new Date(slotTime);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);
        
        // بررسی تداخل
        const hasOverlap = bookedDates.some(b => {
          // فقط رزروهای تأیید یا در انتظار را در نظر بگیر
          if (b.status === 'cancelled') return false;
          const bStart = parseISO(b.start_at);
          const bEnd = parseISO(b.end_at);
          if (!bStart || !bEnd) return false;
          // مقایسه عددی
          return slotStart.getTime() < bEnd.getTime() && slotEnd.getTime() > bStart.getTime();
        });
        
        if (!hasOverlap) {
          hasAvailableSlot = true;
          break;
        }
        
        slotTime.setMinutes(slotTime.getMinutes() + STEP_MIN);
      }
      
      if (hasAvailableSlot) break;
    }
    
    return !hasAvailableSlot; // کامل است اگر slot خالی نباشد
  };

  const goToPrevMonth = () => {
    if (currentJM === 1) { setCurrentJY(y => y-1); setCurrentJM(12); }
    else setCurrentJM(m => m-1);
  };
  const goToNextMonth = () => {
    if (currentJM === 12) { setCurrentJY(y => y+1); setCurrentJM(1); }
    else setCurrentJM(m => m+1);
  };

  // نمی‌توان به ماه‌های قبل از ماه جاری رفت
  const isPrevDisabled = currentJY < todayJalali.jy || (currentJY === todayJalali.jy && currentJM <= todayJalali.jm);

  // ساخت آرایه روزها
  const daysInThisMonth = jalaliMonthDays(currentJY, currentJM);
  const firstWeekday = jalaliFirstWeekday(currentJY, currentJM); // 0=Sat

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInThisMonth; d++) {
    // ساخت dateStr مثل "1404-05-03"
    const jmStr = String(currentJM).padStart(2,'0');
    const jdStr = String(d).padStart(2,'0');
    const dateStr = `${currentJY}-${jmStr}-${jdStr}`;

    // تاریخ میلادی برای مقایسه با امروز
    const gDate = toGregorian(currentJY, currentJM, d);
    gDate.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    const isPast = gDate < today;
    const isAvailable = availableDatesSet.has(dateStr);
    const isSelected = selectedDate === dateStr;
    const isToday = gDate.getTime() === today.getTime();
    const isFull = isAvailable && !isPast && isDateFull(dateStr);

    cells.push({ d, dateStr, isPast, isAvailable, isSelected, isToday, isFull });
  }

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '14px',
      border: '1.5px solid var(--border)',
      padding: 'clamp(10px, 2vw, 14px)',
      boxShadow: '0 4px 20px rgba(37,99,235,0.12)',
      userSelect: 'none',
      maxWidth: 'clamp(280px, 90vw, 340px)',
      margin: '0 auto'
    }}>
      {/* ─── هدر ─── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
        <button
          type="button" // ✅ جلوگیری از submit فرم
          onClick={goToNextMonth}
          style={{
            background:'var(--card-hover)', border:'none', borderRadius:'10px',
            width:'clamp(30px, 8vw, 36px)', height:'clamp(30px, 8vw, 36px)', cursor:'pointer', fontSize:'clamp(16px, 4vw, 20px)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)', fontWeight:700
          }}
        >‹</button>

        <div style={{ textAlign:'center' }}>
          <div style={{ fontWeight:800, fontSize:'clamp(0.85rem, 2vw, 0.95rem)', color: "var(--text-primary)" }}>
            {jalaliMonthNames[currentJM-1]}
          </div>
          <div style={{ fontSize:'clamp(0.7rem, 1.5vw, 0.82rem)', color: "var(--text-secondary)", marginTop:'2px', direction:'ltr' }}>
            {currentJY}
          </div>
        </div>

        <button
          type="button" // ✅ جلوگیری از submit فرم
          onClick={goToPrevMonth}
          disabled={isPrevDisabled}
          style={{
            background: isPrevDisabled ? 'var(--background-secondary)' : 'var(--card-hover)',
            border:'none', borderRadius:'10px',
            width:'clamp(30px, 8vw, 36px)', height:'clamp(30px, 8vw, 36px)',
            cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
            fontSize:'clamp(16px, 4vw, 20px)', display:'flex', alignItems:'center', justifyContent:'center',
            color: isPrevDisabled ? 'var(--text-muted)' : 'var(--primary)', fontWeight:700
          }}
        >›</button>
      </div>

      {/* ─── نام روزها ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'8px' }}>
        {dayLabels.map((lbl, i) => (
          <div key={i} style={{
            textAlign:'center', fontWeight:700, fontSize:'clamp(0.65rem, 1.5vw, 0.78rem)',
            color: i === 6 ? 'var(--danger)' : 'var(--text-secondary)', // جمعه قرمز
            padding:'4px 0'
          }}>{lbl}</div>
        ))}
      </div>

      {/* ─── شبکه روزها ─── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'5px' }}>
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`e-${idx}`} />;

          const { d, dateStr, isPast, isAvailable, isSelected, isToday, isFull } = cell;
          const canClick = isAvailable && !isPast && !isFull;
          const isFriday = (idx % 7) === 6; // ستون آخر = جمعه

          let bg = 'transparent';
          let color = isPast ? 'var(--text-muted)' : isAvailable ? 'var(--text-primary)' : 'var(--text-muted)';
          let border = 'none';
          let fontWeight = isToday ? 700 : 500;

          if (isSelected) {
            bg = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)';
            color = 'var(--text-light)';
            fontWeight = 800;
            border = 'none';
          } else if (isFull) {
            // روز کامل - نوبت‌های آن روز تمام شده است
            bg = 'var(--danger-surface)';
            color = 'var(--danger)';
            fontWeight = 600;
          } else if (isToday && !isPast && isAvailable) {
            border = '2px solid var(--primary)';
            bg = 'var(--surface-accent)';
            color = 'var(--primary)';
          } else if (canClick) {
            bg = 'transparent';
          } else if (!isAvailable && !isPast) {
            // روز بسته (نه تعطیل، بلکه صاحب سالن این روز را ثبت نکرده)
            color = '#cbd5e1';
          }

          if (isFriday && !isSelected && !isFull) color = isPast || !isAvailable ? 'var(--danger)' : 'var(--danger)';

          return (
            <button
              type="button" // ✅ جلوگیری از submit فرم
              key={dateStr}
              onClick={() => {
                if (isFull && onFullDayClick) { onFullDayClick(); return; }
                canClick && onDateChange(dateStr);
              }}
              disabled={!canClick && !isFull}
              title={isFull ? t('booking.fullDayBooked') : (!isAvailable && !isPast ? t('booking.salonClosedToday') : '')}
              style={{
                padding:'0',
                width:'100%',
                aspectRatio:'1',
                borderRadius:'10px',
                border: border || (isToday && !isSelected ? '2px solid var(--primary)' : 'none'),
                background: bg,
                color,
                cursor: canClick ? 'pointer' : 'not-allowed',
                fontWeight,
                fontSize:'clamp(0.7rem, 1.5vw, 0.85rem)',
                transition:'all 0.15s',
                display:'flex', alignItems:'center', justifyContent:'center',
                opacity: isPast ? 0.38 : (!isAvailable ? 0.45 : 1),
                position:'relative',
              }}
              onMouseEnter={(e) => {
                if (canClick && !isSelected) {
                  e.currentTarget.style.background = 'var(--surface-accent)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {d}
              {/* نقطه زیر روزهای امروز */}
              {isToday && !isSelected && (
                <span style={{
                  position:'absolute', bottom:'3px', left:'50%',
                  transform:'translateX(-50%)',
                  width:'4px', height:'4px', borderRadius:'50%',
                  background:'var(--primary)', display:'block'
                }} />
              )}
            </button>
          );
        })}
      </div>

              {/* راهنما ─── */}
      <div style={{
        marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #f1f5f9',
        display:'flex', gap:'16px', justifyContent:'center',
        fontSize:'clamp(0.65rem, 1.5vw, 0.78rem)', color: "var(--text-secondary)", flexWrap:'wrap'
      }}>
        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ display:'inline-block', width:'14px', height:'14px', borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),var(--primary-hover))' }} />
          {t('booking.selected')}
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ display:'inline-block', width:'14px', height:'14px', borderRadius:'4px', border: '2px solid var(--primary)', background:'var(--surface-accent)' }} />
          {t('booking.today')}
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ display:'inline-block', width:'14px', height:'14px', borderRadius:'4px', background:'#fecaca' }} />
          {t('booking.full')}
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ display:'inline-block', width:'14px', height:'14px', borderRadius:'4px', background:'var(--card-hover)', opacity:0.5 }} />
          {t('booking.closed')}
        </span>
      </div>
    </div>
  );
}

export default function Booking() {
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const pageDirection = isEnglish ? 'ltr' : 'rtl';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [bookedDates, setBookedDates] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [salonClosed, setSalonClosed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [dialog, setDialog] = useState(null); // { type, title, message, primaryBtn, secondaryBtn }

  const showDialog = (type, title, message, primaryBtn = null, secondaryBtn = null) => {
    setDialog({ type, title, message, primaryBtn, secondaryBtn });
  };
  const closeDialog = () => setDialog(null);

  const [formData, setFormData] = useState({
    service_id: localStorage.getItem('selected_service_id') || '',
    service_ids: [],
    date: '',
    time: '',
  });

  const salonId = localStorage.getItem('selected_salon_id') || localStorage.getItem('salon_id') || '';

  useEffect(() => {
    // ✅ اگر سالون انتخاب نشده باشد، کاربر را راهنمایی می‌کنیم
    if (!salonId) {
      console.warn('❌ هیچ سالونی انتخاب نشده است - لطفاً ابتدا یک سالون انتخاب کنید');
      showDialog(
        'warning',
        t('booking.noSalonSelectedTitle'),
        t('booking.noSalonSelectedMessage'),
        { label: t('booking.goHome'), action: () => navigate('/') }
      );
      setLoading(false);
      return;
    }

    // ✅ اگر یک سرویس از قبل انتخاب شده باشد، آن را برای checkbox نیز تنظیم کن
    const preSelectedServiceId = localStorage.getItem('selected_service_id');
    if (preSelectedServiceId) {
      setFormData(prev => ({
        ...prev,
        service_ids: [preSelectedServiceId]
      }));
    }

    console.log('🏢 Booking component mounted with salonId:', salonId);
    loadServices();
    loadBookedDates();
    loadWorkingHours();
    const iv = setInterval(() => {
      loadBookedDates();
    }, 5000); // ← تایمر را به ۵ ثانیه کاهش دادیم تا به‌روزرسانی سریع‌تر باشد
    
    // Track window width for responsive layout
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(iv);
      window.removeEventListener('resize', handleResize);
    };
  }, [salonId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await api.getServices(salonId);
      // فیلتر کردن سرویس‌های فعال و با قیمت معتبر (> 0)
      setServices(response.data.filter(s => s.is_active && s.price > 0));
      setError('');
    } catch (err) {
      console.error('Failed to load services:', err);
      showDialog(
        'error',
        'خطا در بارگذاری',
        'دریافت لیست سرویس‌ها با مشکل مواجه شد. لطفاً صفحه را مجدداً بارگذاری کنید.',
        { label: t('booking.tryAgain'), action: () => { closeDialog(); loadServices(); } },
        { label: t('booking.goBack'), action: () => navigate('/') }
      );
    } finally {
      setLoading(false);
    }
  };

  const loadBookedDates = async () => {
    try {
      const response = await api.getBookings(salonId);
      console.log('📅 loadBookedDates: raw response:', response.data);
      console.log('📅 loadBookedDates: count:', response.data?.length || 0);
      
      // بررسی فرمت start_at و end_at
      if (response.data && response.data.length > 0) {
        console.log('📅 First booking:', response.data[0]);
        console.log('📅 start_at:', response.data[0].start_at);
        console.log('📅 end_at:', response.data[0].end_at);
      }
      
      setBookedDates(response.data || []);
    } catch (err) {
      console.error('Failed to load booked dates:', err);
    }
  };

  const loadWorkingHours = async () => {
    try {
      console.log('🔵 loadWorkingHours: fetching for salonId:', salonId);
      const response = await api.getWorkingHours(salonId);
      console.log('🟢 loadWorkingHours: received data:', response.data);
      console.log('🟢 loadWorkingHours: count:', response.data?.length || 0);
      setWorkingHours(response.data || []);
    } catch (err) {
      console.error('❌ Failed to load working hours for salonId:', salonId, 'Error:', err);
      console.error('Error response:', err.response?.data);
      // اگر working hours پیدا نشد، مقادیر پیشفرض را استفاده کن
      setWorkingHours([]);
    }
  };

  useEffect(() => {
    if (workingHours.length > 0) {
      console.log('📅 Building date options with', workingHours.length, 'working hours');
      buildDateOptions();
    } else {
      console.log('⚠️ No working hours found for salon ID:', salonId);
      setDateOptions([]);
      setAvailableTimes([]);
      setSalonClosed(true);
    }
  }, [workingHours]);

  useEffect(() => {
    buildAvailableTimes();
  }, [formData.date, formData.service_ids, formData.service_id, bookedDates, workingHours, dateOptions, services]);

  const buildDateOptions = async (days = 60) => {
    const opts = [];
    const today = new Date();
    const datesToCheck = [];
    const dateMap = {};
    
    // ابتدا تمام تاریخ‌های احتمالی را بسازیم
    for (let i = 0; i < days; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const jalaliDate = toJalaliString(d);
      
      // فارسی تاریخ از toJalaliString درتر می‌آید مثل "04 بهمن 1404"
      // ما نیاز داریم تبدیل کنیم به "1404-04-04" برای سرور
      const dateStr = getDateStringFromJalali(d);
      if (dateStr) {
        datesToCheck.push(dateStr);
        dateMap[dateStr] = { d, jalaliDate, gregorianDate: new Date(d) };
      }
    }
    
    console.log('buildDateOptions - Requesting day of week for', datesToCheck.length, 'dates');
    console.log('Working hours available:', workingHours.length, workingHours);
    
    try {
      // درخواست سرور برای محاسبهٔ روز هفته
      const response = await api.calculateDayOfWeek(datesToCheck);
      const dayOfWeekMap = response.data;
      console.log('Day of week response:', dayOfWeekMap);
      
      // بررسی ساعات کاری و ساخت options
      for (const dateStr of datesToCheck) {
        if (dayOfWeekMap[dateStr]) {
          const { day_of_week: ourWeekday, day_name: dayName } = dayOfWeekMap[dateStr];
          
          // بررسی اینکه آیا برای این روز ساعات کاری وجود دارد
          const hasWorkingHours = workingHours.some(wh => wh.day_of_week === ourWeekday);
          console.log(`${dateStr} (${dayName}): day_of_week=${ourWeekday}, hasWorkingHours=${hasWorkingHours}`);
          
          // فقط روزهایی را اضافه کن که سالن در آن روز باز است
          if (hasWorkingHours) {
            const { jalaliDate, gregorianDate } = dateMap[dateStr];
            // Use English-friendly label when app is in English: weekday + formatted gregorian date
            const label = isEnglish
              ? `${getDayName(ourWeekday)} - ${formatBookingDateLabel(gregorianDate)}`
              : `${dayName} - ${jalaliDate}`;
            opts.push({ key: dateStr, label, dayOfWeek: ourWeekday, gregorianDate });
          }
        }
      }
      
      console.log('Date options built:', opts.length, 'options');
      setDateOptions(opts);
    } catch (err) {
      console.error('Failed to calculate day of week:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error message:', err.message);
      // Fallback: استفاده از روش قدیمی اگر سرور کار نکند
      setDateOptions([]);
      showDialog(
        'error',
        t('booking.calendarErrorTitle'),
        t('booking.calendarErrorMessage'),
        { label: t('booking.tryAgain'), action: () => { closeDialog(); buildDateOptions(); } }
      );
    }
  };

  const getDateStringFromJalali = (gDate) => {
    // تبدیل تاریخ میلادی به فارسی (Jalali) در قالب "1404-04-04"
    try {
      const jalaliStr = gDate.toLocaleDateString('fa-IR');
      // jalaliStr looks like "۱۴۰۴/۰۴/۰۴" (Persian digits)
      // Convert to "1404/04/04" (English digits)
      const parts = jalaliStr.split('/');
      if (parts.length === 3) {
        let [py, pm, pd] = parts;
        
        // Convert Persian digits to English
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        for (let i = 0; i < 10; i++) {
          py = py.replaceAll(persianDigits[i], englishDigits[i]);
          pm = pm.replaceAll(persianDigits[i], englishDigits[i]);
          pd = pd.replaceAll(persianDigits[i], englishDigits[i]);
        }
        
        return `${py}-${pm.padStart(2, '0')}-${pd.padStart(2, '0')}`;
      }
    } catch (e) {}
    return '';
  };

  const getDayName = (dayOfWeek) => {
    const faDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const enDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return isEnglish ? (enDays[dayOfWeek] || 'Unknown') : (faDays[dayOfWeek] || 'نامشخص');
  };

  const getWorkingHoursForDay = (dayOfWeek) => {
    return workingHours.filter(wh => wh.day_of_week === dayOfWeek);
  };

  const formatTime = (timeString) => {
    // timeString is like "10:30"
    if (!timeString) return '';
    return timeString; // زمان به صورت HH:MM نمایش داده می‌شود
  };

  const getSelectedDateInfo = () => {
    if (!formData.date) return null;
    const normalizedDate = normalizeDate(formData.date);
    const dateOption = dateOptions.find(d => d.key === normalizedDate);
    if (!dateOption) return null;
    const dayWorkingHours = getWorkingHoursForDay(dateOption.dayOfWeek);
    return {
      ...dateOption,
      workingHours: dayWorkingHours
    };
  };

  const getTotalDurationMinutes = () => {
    if (formData.service_ids && formData.service_ids.length > 0) {
      const selected = services.filter(s => {
        const serviceIdStr = String(s.id);
        return formData.service_ids.includes(serviceIdStr);
      });
      const total = selected.reduce((acc, s) => acc + (Number(s.duration_minutes) || 0), 0);
      console.log('Selected services:', selected, 'Total duration:', total);
      return total;
    }
    const s = services.find(sv => sv.id === parseInt(formData.service_id) || String(sv.id) === formData.service_id);
    return s ? (Number(s.duration_minutes) || 0) : 0;
  };

  const normalizeDate = (dateStr) => {
    // تبدیل اعداد فارسی به انگریزی در تاریخ
    // ۰۱۲۳۴۵۶۷۸۹ -> 0123456789
    if (!dateStr) return dateStr;
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let normalized = dateStr;
    for (let i = 0; i < 10; i++) {
      normalized = normalized.replaceAll(persianDigits[i], englishDigits[i]);
    }
    return normalized;
  };

  // ─── تابع اصلی ساخت لیست ساعت‌ها (با نمایش همه‌ی slot‌ها و مشخص کردن رزروشده) ───
  const buildAvailableTimes = () => {
    const normalizedDate = normalizeDate(formData.date);
    console.log('=== buildAvailableTimes DEBUG ===');
    console.log('formData.date:', formData.date);
    console.log('📅 Total booked dates from server:', bookedDates.length);
    
    // بررسی نمونه برای debugging
    if (bookedDates.length > 0) {
      console.log('📅 First booked date object:', JSON.stringify(bookedDates[0], null, 2));
      console.log('   start_at:', bookedDates[0].start_at);
      console.log('   end_at:', bookedDates[0].end_at);
    }
    console.log('normalizedDate:', normalizedDate);
    console.log('dateOptions length:', dateOptions.length);
    
    if (!normalizedDate) {
      console.log('ERROR: normalizedDate is empty');
      setAvailableTimes([]);
      setSalonClosed(false);
      return;
    }

    // بدست آوری روز هفته صحیح از dateOptions (که از سرور محاسبه شده)
    const dateOption = dateOptions.find(opt => opt.key === normalizedDate);
    console.log('Looking for dateOption with key:', normalizedDate);
    console.log('Found dateOption:', dateOption);
    
    if (!dateOption) {
      console.log('ERROR: No dateOption found - salon probably closed this day');
      setAvailableTimes([]);
      setSalonClosed(true);
      return;
    }
    
    // استفاده از تاریخ Gregorian ذخیره شده
    const selectedDate = new Date(dateOption.gregorianDate);
    const duration = getTotalDurationMinutes() || 30;
    
    const ourWeekday = dateOption.dayOfWeek;
    console.log('Selected date:', selectedDate);
    console.log('Duration:', duration, 'minutes');
    console.log('Day of week:', ourWeekday);

    // پیدا کردن working hours برای این روز
    const dayWorkingHours = getWorkingHoursForDay(ourWeekday);
    console.log('Working hours for this day:', dayWorkingHours);
    console.log('Working hours JSON:', JSON.stringify(dayWorkingHours, null, 2));
    
    if (dayWorkingHours.length === 0) {
      console.log('ERROR: No working hours for this day');
      setAvailableTimes([]);
      setSalonClosed(true);
      return;
    }

    setSalonClosed(false);

    const slots = [];
    const STEP_MIN = 30;

    // محاسبه "امروز" برای مقایسه
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateMidnight = new Date(selectedDate);
    selectedDateMidnight.setHours(0, 0, 0, 0);
    
    const isToday = selectedDateMidnight.getTime() === today.getTime();
    console.log(`📅 Is selected date today? ${isToday}`);

    // برای هر working hour slot
    for (const wh of dayWorkingHours) {
      const [startHour, startMin] = wh.start_time.split(':').map(x => parseInt(x, 10));
      const [endHour, endMin] = wh.end_time.split(':').map(x => parseInt(x, 10));
      
      const startTimeOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), startHour, startMin, 0);
      const endTimeOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), endHour, endMin, 0);

      console.log(`\n📍 Processing working hour: ${wh.start_time} - ${wh.end_time}`);
      console.log(`  startTimeOfDay: ${startTimeOfDay.toLocaleTimeString('fa-IR')}`);
      console.log(`  endTimeOfDay: ${endTimeOfDay.toLocaleTimeString('fa-IR')}`);

      // ساخت slots در این working hour interval
      let slotTime = new Date(startTimeOfDay);
      let slotCount = 0;
      
      while (slotTime.getTime() + (duration * 60000) <= endTimeOfDay.getTime()) {
        const slotStart = new Date(slotTime);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // تعیین اینکه آیا این slot گذشته است یا نه
        let isPastSlot = false;
        if (isToday) {
          const now = new Date();
          isPastSlot = slotStart <= now;
        }

        if (isPastSlot) {
          console.log(`  ⏭️  SKIP slot (in past): ${slotStart.toLocaleTimeString('fa-IR')}`);
        } else {
          // بررسی تداخل با رزروهای موجود - فقط رزروهای pending یا confirmed
          let hasOverlap = false;
          bookedDates.some(b => {
            // فقط رزروهای غیر لغو شده را در نظر بگیر
            if (b.status === 'cancelled') return false;
            const bStart = parseISO(b.start_at);
            const bEnd = parseISO(b.end_at);
            if (!bStart || !bEnd) {
              console.warn('⚠️ Invalid booking dates:', b.start_at, b.end_at);
              return false;
            }
            
            // مقایسه عددی با getTime()
            const overlap = (slotStart.getTime() < bEnd.getTime() && slotEnd.getTime() > bStart.getTime());
            if (overlap) {
              hasOverlap = true;
              console.log(`  🔴 Overlap detected with booking ${b.id}:`, {
                slotStart: slotStart.toISOString(),
                slotEnd: slotEnd.toISOString(),
                bStart: bStart.toISOString(),
                bEnd: bEnd.toISOString()
              });
              return true;
            }
            return false;
          });

          const isoTime = slotStart.toISOString();
          // اضافه کردن همه‌ی slotها به لیست، چه رزرو شده باشند چه نه
          slots.push({
            value: isoTime,
            label: new Date(isoTime).toLocaleTimeString(isEnglish ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' }),
            isBooked: hasOverlap  // ← پرچم رزرو بودن
          });
          slotCount++;
          console.log(`  ${hasOverlap ? '🔴' : '✅'} SLOT ${hasOverlap ? '(BOOKED)' : '(AVAILABLE)'}: ${slotStart.toLocaleTimeString('fa-IR')} - ${slotEnd.toLocaleTimeString('fa-IR')} (ISO: ${isoTime})`);
        }
        
        slotTime.setMinutes(slotTime.getMinutes() + STEP_MIN);
      }
      
      console.log(`  📊 Total slots created for this period: ${slotCount}`);
    }

    console.log('📋 Total slots (including booked):', slots.length);
    console.log('📋 Slots:', slots);
    setAvailableTimes(slots);
    console.log('=================================\n');
  };

  const jMonths = isEnglish
    ? ['Farvardin','Ordibehesht','Khordad','Tir','Mordad','Shahrivar','Mehr','Aban','Azar','Dey','Bahman','Esfand']
    : ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

  const formatBookingDateLabel = (dateValue) => {
    const date = new Date(dateValue);
    if (!date || Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatBookingTimeLabel = (dateValue) => {
    const date = new Date(dateValue);
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(isEnglish ? 'en-US' : 'fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toJalaliString = (gDate) => {
    try {
      const parts = gDate.toLocaleDateString('fa-IR').split('/');
      if (parts.length === 3) {
        const [py, pm, pd] = parts;
        const monthIdx = parseInt(pm, 10) - 1;
        return `${pd} ${jMonths[monthIdx] || ''} ${py}`;
      }
    } catch (e) {}
    return gDate.toLocaleDateString('fa-IR');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.service_id && (!formData.service_ids || formData.service_ids.length === 0)) {
      newErrors.service_id = isEnglish ? t('booking.selectServiceHint', 'Please select at least one service') : t('booking.selectServiceHint', 'لطفا حداقل یک سرویس را انتخاب کنید');
    }

    if (!formData.date || !formData.time) {
      newErrors.start_at = isEnglish ? t('booking.selectDateTimeHint', 'Date and time selection is required') : t('booking.selectDateTimeHint', 'انتخاب تاریخ و زمان الزامی است');
    } else {
      const selectedTime = new Date(formData.time);
      const now = new Date();
      if (selectedTime <= now) {
        newErrors.start_at = isEnglish ? t('booking.invalidPastTime', 'You cannot select a past time') : t('booking.invalidPastTime', 'نمی‌توانید زمان گذشته را انتخاب کنید');
      }
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === 'date') {
      newValue = normalizeDate(value);
      setFormData(prev => ({ ...prev, [name]: newValue, time: '' }));
    } else if (name === 'service_id') {
      setFormData(prev => ({ ...prev, [name]: newValue, date: '', time: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const handleCheckboxChange = (serviceId) => {
    setFormData(prev => {
      const serviceIdStr = String(serviceId);
      const exists = prev.service_ids.includes(serviceIdStr);
      const next = exists ? prev.service_ids.filter(x => x !== serviceIdStr) : [...prev.service_ids, serviceIdStr];
      // جب سروس‌ها تبدیل شود، تاریخ و ساعت را reset کن
      return { ...prev, service_ids: next, date: '', time: '' };
    });
    if (errors.service_id) setErrors(prev => ({ ...prev, service_id: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showDialog(
        'warning',
        isEnglish ? 'Log in to your account' : 'ورود به حساب کاربری',
        isEnglish ? 'To book an appointment, you need to log in or sign up first.' : 'برای رزرو نوبت ابتدا باید وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
        { label: isEnglish ? 'Log in / Sign up' : 'ورود / ثبت‌نام', action: () => navigate('/login') },
        { label: isEnglish ? 'Cancel' : 'انصراف', action: closeDialog }
      );
      return;
    }

    // قبل از ارسال، یک بار دیگر لیست رزروها را به‌روز می‌کنیم تا از آخرین وضعیت مطمئن شویم
    await loadBookedDates();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // نمایش خطاهای اعتبارسنجی در دیالوگ
      const errorMessages = Object.values(newErrors).join('\n');
      showDialog(
        'warning',
        isEnglish ? 'Incomplete information' : 'اطلاعات ناقص',
        errorMessages,
        { label: isEnglish ? 'OK' : 'باشه', action: closeDialog }
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {};
      
      if (formData.time) {
        payload.start_at = new Date(formData.time).toISOString();
      }
      if (formData.service_ids && formData.service_ids.length > 0) {
        payload.service_ids = formData.service_ids.map(x => parseInt(x));
      } else {
        payload.service_id = parseInt(formData.service_id);
      }

      console.log('=== BOOKING SUBMISSION ===');
      console.log('Booking payload being sent:', JSON.stringify(payload, null, 2));
      console.log('Full form data:', formData);
      console.log('Salon ID:', salonId);
      console.log('Available times count:', availableTimes.length);
      console.log('=========================');

      const response = await api.createBooking(salonId, payload);

      await loadBookedDates();

      setFormData({
        service_id: localStorage.getItem('selected_service_id') || '',
        service_ids: [],
        date: '',
        time: '',
      });
      setErrors({});

      showDialog(
        'success',
        isEnglish ? 'Appointment booked successfully! 🎉' : 'نوبت با موفقیت ثبت شد! 🎉',
        isEnglish ? 'Your appointment was booked successfully. You can cancel it up to 24 hours before the appointment. You will be redirected to the home page shortly.' : 'نوبت شما با موفقیت رزرو شد. تا 24 ساعت قبل می‌توانید این نوبت را لغو کنید. به زودی به صفحه اصلی منتقل می‌شوید.',
        {
          label: isEnglish ? 'Back to home' : 'بازگشت به صفحه اصلی',
          action: () => { closeDialog(); navigate('/'); }
        }
      );

      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      const statusCode = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data?.detail || '';

      if (statusCode === 409 || (serverMsg && serverMsg.includes('تداخل'))) {
        await loadBookedDates();
        showDialog(
          'error',
          isEnglish ? 'Time conflict' : 'تداخل زمانی',
          isEnglish ? 'This time slot has just been booked by another customer. Please choose another time.' : 'متأسفانه این بازه زمانی همین لحظه توسط شخص دیگری رزرو شد. لطفاً ساعت دیگری انتخاب کنید.',
          { label: isEnglish ? 'Choose another time' : 'انتخاب ساعت جدید', action: closeDialog }
        );
      } else if (statusCode === 401) {
        showDialog(
          'warning',
          isEnglish ? 'Access restricted' : 'دسترسی محدود',
          isEnglish ? 'You need to log in to your account to book an appointment.' : 'برای رزرو نوبت باید وارد حساب کاربری خود شوید.',
          { label: isEnglish ? 'Log in' : 'ورود به حساب', action: () => navigate('/login') },
          { label: isEnglish ? 'Cancel' : 'انصراف', action: closeDialog }
        );
      } else if (statusCode === 403) {
        // اگر پاسخ سرور به خاطر شهر بود، دیالوگ خاص نشان بده
        if (serverMsg && serverMsg.includes('این سالن متعلق به شهر دیگری')) {
          showDialog(
            'error',
            isEnglish ? 'Invalid city' : 'شهر نامعتبر',
            serverMsg,
            { label: isEnglish ? 'OK' : 'باشه', action: closeDialog }
          );
        } else {
          showDialog(
            'warning',
            isEnglish ? 'Access restricted' : 'دسترسی محدود',
            serverMsg || (isEnglish ? 'You are not allowed to perform this action.' : 'شما اجازه انجام این عمل را ندارید.'),
            { label: isEnglish ? 'OK' : 'باشه', action: closeDialog }
          );
        }
      } else if (statusCode === 400 && serverMsg) {
        showDialog(
          'error',
          isEnglish ? 'Booking error' : 'خطا در ثبت نوبت',
          serverMsg,
          { label: isEnglish ? 'OK' : 'باشه', action: closeDialog }
        );
      } else if (!navigator.onLine) {
        showDialog(
          'error',
          isEnglish ? 'No internet connection' : 'عدم اتصال به اینترنت',
          isEnglish ? 'Your internet connection is offline. Please check your connection and try again.' : 'اتصال اینترنت شما قطع است. لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.',
          { label: isEnglish ? 'OK' : 'باشه', action: closeDialog }
        );
      } else {
        showDialog(
          'error',
          isEnglish ? 'Booking error' : 'خطا در ثبت نوبت',
          serverMsg || (isEnglish ? 'Booking failed. Please try again.' : 'ثبت نوبت با مشکل مواجه شد. لطفاً دوباره تلاش کنید.'),
          { label: isEnglish ? 'Try again' : 'تلاش مجدد', action: closeDialog }
        );
      }

      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedService = () => {
    if (formData.service_ids && formData.service_ids.length > 0) {
      return services.filter(s => formData.service_ids.includes(String(s.id)));
    }
    return services.find(s => s.id === parseInt(formData.service_id));
  };

  const selectedService = getSelectedService();

  if (loading) return <Loading />;

  // ✅ اگر ساعات کاری تعریف نشده باشند
  if (!loading && workingHours.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          background: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          direction: pageDirection
        }}
      >
        <Card style={{
          maxWidth: '600px',
          textAlign: 'center',
          padding: '3rem'
        }}>
          <Scissors size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: "var(--text-primary)", marginBottom: '1rem' }}>{t('booking.noWorkingHoursTitle', 'This salon has not defined its working hours yet')}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: '2rem' }}>
            {t('booking.noWorkingHoursMessage', 'The salon owner has not set working hours yet. Please try again later.')}
          </p>
          <button
            onClick={() => navigate('/services')}
            style={{
              padding: '0.8rem 1.5rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            {t('booking.noWorkingHoursButton', 'Back to home')}
          </button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        direction: pageDirection
      }}
    >
      {/* هدر با گرادیانت */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          padding: '2.5rem 1.5rem',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '300px',
          height: '300px',
          background: 'var(--surface-glass)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '250px',
          height: '250px',
          background: 'var(--surface-glass-muted)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.div
              initial={{ scale: 0.9, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
              }}
            >
              <Calendar size={32} color="#FFFFFF" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  color: 'white',
                  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                  fontWeight: 800,
                  margin: 0,
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                {t('booking.title', isEnglish ? 'Book an appointment' : 'رزرو نوبت')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  margin: '4px 0 0 0'
                }}
              >
                {t('booking.subtitle', isEnglish ? 'Choose a convenient date and time' : 'لطفاً اطلاعات خود را وارد کنید')}
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '50px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              {isEnglish ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              {t('booking.back', isEnglish ? 'Back' : 'بازگشت')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '2rem 1.5rem'
      }}>
        {/* پیام‌های موفقیت/خطا */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <Alert type="success" message={success} onClose={() => setSuccess('')} />
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <Alert type="error" message={error} onClose={() => setError('')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* محتوای اصلی: دو ستونه */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* فرم رزرو */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card style={{
              background: 'var(--card)',
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: "1px solid var(--border)",
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
              }} />

              <form onSubmit={handleSubmit}>
                {/* انتخاب سرویس‌ها (چندتایی) */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: "var(--text-primary)"
                  }}>
                    {t('booking.servicesLabel', 'Services (multiple selection)')}
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {services.map(s => (
                      <label
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: formData.service_ids.includes(String(s.id)) ? 'var(--surface-accent-strong)' : 'var(--surface-subtle)',
                          border: formData.service_ids.includes(String(s.id)) ? '2px solid var(--primary)' : '2px solid var(--border)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          value={s.id}
                          checked={formData.service_ids.includes(String(s.id))}
                          onChange={() => handleCheckboxChange(s.id)}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          background: formData.service_ids.includes(String(s.id)) ? 'var(--primary)' : 'var(--card)',
                          border: formData.service_ids.includes(String(s.id)) ? '2px solid var(--primary)' : '2px solid var(--border-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {formData.service_ids.includes(String(s.id)) && (
                            <CheckCircle size={14} color="white" />
                          )}
                        </div>
                        <div style={{ flex: 1, fontSize: '0.9rem', color: "var(--text-primary)", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                          <span style={{ color: "var(--text-secondary)", whiteSpace: 'nowrap', direction: isEnglish ? 'ltr' : 'rtl' }}>
                            {formatToman(Number(s.price) || 0, isEnglish)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.service_id && <FieldErrorBox message={errors.service_id} />}
                </div>

                {/* تاریخ */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: "var(--text-primary)"
                  }}>
                    {t('booking.dateLabel', 'Date')}
                  </label>
                  
                  {dateOptions.length === 0 && workingHours.length === 0 && (
                    <div style={{
                      background: 'var(--danger-surface)',
                      border: '2px solid var(--danger-border)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--danger-text)',
                        fontWeight: 600
                      }}>
                        ⚠️ متأسفانه سالن ساعات کاری تعریف نشده دارد. لطفا بعداً دوباره سعی کنید.
                      </div>
                    </div>
                  )}

                  {dateOptions.length === 0 && workingHours.length > 0 && (
                    <div style={{
                      background: 'var(--danger-surface)',
                      border: '2px solid var(--danger-border)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--danger-text)',
                        fontWeight: 600
                      }}>
                        ⚠️ متأسفانه در 60 روز آینده روز بازی برای رزرو وجود ندارد.
                      </div>
                    </div>
                  )}

                  {dateOptions.length > 0 && (
                    <JalaliCalendarPicker
                      dateOptions={dateOptions}
                      selectedDate={formData.date}
                      onDateChange={(dateStr) => {
                        setFormData(prev => ({ ...prev, date: dateStr, time: '' }));
                        if (errors.start_at) setErrors(prev => ({ ...prev, start_at: '' }));
                        if (error) setError('');
                      }}
                      bookedDates={bookedDates}
                      workingHours={workingHours}
                      onFullDayClick={() => showDialog(
                        'warning',
                        t('booking.fullDayBookedTitle', 'Fully booked'),
                        t('booking.fullDayBookedMessage', 'All slots for this day are already booked. Please choose another day.'),
                        { label: t('common.ok', 'OK'), action: closeDialog }
                      )}
                      t={t}
                      isEnglish={isEnglish}
                    />
                  )}
                </div>

                {/* ساعت */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: "var(--text-primary)"
                  }}>
                    {t('booking.timeLabel', 'Time')}
                  </label>
                  
                  {/* نمایش ساعات کاری روز انتخاب‌شده */}
                  {formData.date && getSelectedDateInfo() && (
                    <div style={{
                      background: 'var(--success-surface)',
                      border: '1px solid var(--success-border)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--success-text)',
                        marginBottom: '6px',
                        fontWeight: 600
                      }}>
                        {isEnglish ? `Working hours for ${getSelectedDateInfo().label}:` : `ساعات کاری برای ${getSelectedDateInfo().label}:`}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '8px'
                      }}>
                        {getSelectedDateInfo().workingHours.map((wh, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '0.9rem',
                              color: '#166534',
                              padding: '8px',
                              background: 'rgba(34, 197, 94, 0.1)',
                              borderRadius: '8px',
                              textAlign: 'center'
                            }}
                          >
                            {formatTime(wh.start_time)} - {formatTime(wh.end_time)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {salonClosed && formData.date && (
                    <div style={{
                      background: 'var(--danger-surface)',
                      border: '2px solid var(--danger-border)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--danger-text)',
                        fontWeight: 600
                      }}>
                        {isEnglish ? '⚠️ The salon is closed on this day. Please choose another day.' : '⚠️ سالن در این روز باز نیست. لطفا روز دیگری را انتخاب کنید.'}
                      </div>
                    </div>
                  )}

                  {formData.date && !salonClosed && availableTimes.length === 0 && (
                    <div style={{
                      background: 'var(--danger-surface)',
                      border: '2px solid var(--danger-border)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--danger-text)',
                        fontWeight: 600
                      }}>
                        {isEnglish ? '⚠️ All appointments for this day are booked. Please choose another day.' : '⚠️ متأسفانه تمام نوبت‌های این روز رزرو شده است. لطفا روز دیگری را انتخاب کنید.'}
                      </div>
                    </div>
                  )}

                  {!formData.date && (
                    <div style={{
                      background: 'var(--info-surface)',
                      border: '1px solid var(--info-border)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--info-text)',
                        fontWeight: 600
                      }}>
                        {t('booking.selectDateFirst', 'Please choose a booking date first')}
                      </div>
                    </div>
                  )}

                  {/* دکمه باز کردن modal */}
                  <button
                    type="button"
                    onClick={() => setShowTimeModal(true)}
                    disabled={salonClosed || availableTimes.length === 0 || !formData.date}
                    style={{
                      width: '100%',
                      padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)',
                      border: formData.time ? '2px solid var(--primary)' : '2px solid var(--border)',
                      borderRadius: '14px',
                      fontSize: 'clamp(14px, 2vw, 16px)',
                      color: formData.time ? 'var(--primary)' : 'var(--text-secondary)',
                      backgroundColor: formData.time ? 'var(--surface-accent-strong)' : 'var(--card)',
                      fontWeight: formData.time ? 600 : 500,
                      cursor: salonClosed || availableTimes.length === 0 || !formData.date ? 'not-allowed' : 'pointer',
                      opacity: salonClosed || availableTimes.length === 0 || !formData.date ? 0.6 : 1,
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onFocus={(e) => {
                      if (!salonClosed && availableTimes.length > 0 && formData.date) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = formData.time ? 'var(--primary)' : 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Clock size={18} />
                    {formData.time ? `${t('booking.timeLabel', 'Time')} ${formatBookingTimeLabel(formData.time)}` : t('booking.selectTimeButton', 'Select time')}
                  </button>
                  {errors.start_at && <FieldErrorBox message={errors.start_at} />}
                </div>

                {/* دکمه ثبت */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submitting}
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                      color: 'white',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {submitting ? t('booking.submittingButton', 'Booking...') : t('booking.submitButton', 'Book appointment')}
                  </Button>
                </motion.div>
              </form>
            </Card>
          </motion.div>

          {/* پیش‌نمایش سرویس */}
          {selectedService && (Array.isArray(selectedService) ? selectedService.length > 0 : true) && windowWidth >= 1024 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card style={{
                background: 'var(--card)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                border: "1px solid var(--border)",
                overflow: 'hidden',
                position: 'sticky',
                top: '100px'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--danger) 100%)'
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--danger) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 6px 16px rgba(240, 147, 251, 0.3)'
                  }}>
                    <Sparkles size={24} />
                  </div>
                  <h2 style={{
                    color: "var(--text-primary)",
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    margin: 0
                  }}>
                    {t('booking.summaryTitle', isEnglish ? 'Booking summary' : 'خلاصه نوبت')}
                  </h2>
                </div>

                <div style={{
                  background: 'var(--background-secondary)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: "var(--text-secondary)" }}>{t('booking.servicesSummary', 'Services')}</div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: '1.1rem' }}>
                      {Array.isArray(selectedService)
                        ? selectedService.map(s => s.name).join(' + ')
                        : selectedService.name}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={18} style={{ color: 'var(--primary)' }} />
                      <span style={{ color: "var(--text-secondary)" }}>{t('booking.durationSummary', 'Duration')}</span>
                    </div>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {(() => {
                        const total = Array.isArray(selectedService)
                          ? selectedService.reduce((acc, s) => acc + (Number(s.duration_minutes) || 0), 0)
                          : Number(selectedService.duration_minutes) || 0;
                        return isEnglish ? `${total} min` : `${toPersianNumber(total)} دقیقه`;
                      })()}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DollarSign size={18} style={{ color: 'var(--accent)' }} />
                      <span style={{ color: "var(--text-secondary)" }}>{t('booking.priceSummary', 'Price')}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.2rem' }}>
                      {Array.isArray(selectedService)
                          ? formatToman(selectedService.reduce((acc, s) => {
                              const price = Number(s.price) || 0;
                              return acc + price;
                            }, 0), isEnglish)
                          : formatToman(Number(selectedService.price) || 0, isEnglish)}
                    </span>
                  </div>
                </div>

                {formData.time && (
                  <div style={{
                    background: 'linear-gradient(135deg, var(--surface-accent) 0%, var(--surface-accent-strong) 100%)',
                    border: '1.5px solid var(--surface-accent-border)',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={20} color="white" />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: 'var(--surface-accent-text)',
                        lineHeight: 1.3
                      }}>
                        {formatBookingDateLabel(formData.time)}
                      </div>
                      <div style={{
                        fontSize: '0.88rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        marginTop: '2px'
                      }}>
                        {isEnglish ? 'Time ' : 'ساعت '} {formatBookingTimeLabel(formData.time)}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--primary)'
                  }}>
                    <Info size={18} />
                    <span style={{ fontSize: '0.95rem' }}>{t('booking.confirmationText', 'Your booking confirmation will be sent by Email.')}</span>
                  </div>
                </div>

                {/* ساعات کاری سالن */}
                {workingHours.length > 0 && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '1rem'
                    }}>
                      <Clock size={18} style={{ color: 'var(--primary)' }} />
                      <h3 style={{
                        margin: 0,
                        color: "var(--text-primary)",
                        fontSize: '1rem',
                        fontWeight: 700
                      }}>
                        {t('booking.workingHoursTitle', 'Salon working hours')}
                      </h3>
                    </div>
                    <div style={{
                      display: 'grid',
                      gap: '0.75rem'
                    }}>
                      {(() => {
                        const daysByWeek = {};
                        workingHours.forEach(wh => {
                          if (!daysByWeek[wh.day_of_week]) {
                            daysByWeek[wh.day_of_week] = [];
                          }
                          daysByWeek[wh.day_of_week].push(wh);
                        });
                        
                        return Object.entries(daysByWeek).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([dayOfWeek, hours]) => (
                          <div key={dayOfWeek} style={{
                            background: 'var(--background-secondary)',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{
                              fontSize: '0.9rem',
                              color: "var(--text-primary)",
                              fontWeight: 600
                            }}>
                              {getDayName(parseInt(dayOfWeek))}
                            </span>
                            <div style={{
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              justifyContent: 'flex-end'
                            }}>
                              {hours.map((h, idx) => (
                                <span key={idx} style={{
                                  fontSize: '0.85rem',
                                  color: "var(--text-secondary)",
                                  background: 'var(--card)',
                                  padding: '4px 8px',
                                  borderRadius: '6px'
                                }}>
                                  {formatTime(h.start_time)} - {formatTime(h.end_time)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </div>

        {/* پیش‌نمایش سرویس برای موبایل - در پایین فرم */}
        {selectedService && (Array.isArray(selectedService) ? selectedService.length > 0 : true) && windowWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ marginTop: '2rem' }}
          >
            <Card style={{
              background: 'var(--card)',
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: "1px solid var(--border)",
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--danger) 100%)'
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--danger) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
                }}>
                  <Sparkles size={24} />
                </div>
                <h2 style={{
                  color: "var(--text-primary)",
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  {t('booking.summaryTitle', isEnglish ? 'Booking summary' : 'خلاصه نوبت')}
                </h2>
              </div>

              <div style={{
                background: 'var(--background-secondary)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: "var(--text-secondary)" }}>{t('booking.servicesSummary', 'Services')}</div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: '1.1rem' }}>
                    {Array.isArray(selectedService)
                      ? selectedService.map(s => s.name).join(' + ')
                      : selectedService.name}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={18} style={{ color: 'var(--primary)' }} />
                    <span style={{ color: "var(--text-secondary)" }}>{t('booking.durationSummary', 'Duration')}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {Array.isArray(selectedService)
                      ? toPersianNumber(selectedService.reduce((acc, s) => acc + (Number(s.duration_minutes) || 0), 0))
                        : (isEnglish ? `${Number(selectedService.duration_minutes || 0)} min` : `${toPersianNumber(Number(selectedService.duration_minutes) || 0)} دقیقه`)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={18} style={{ color: 'var(--accent)' }} />
                    <span style={{ color: "var(--text-secondary)" }}>{t('booking.priceSummary', 'Price')}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.2rem' }}>
                    {Array.isArray(selectedService)
                      ? formatToman(selectedService.reduce((acc, s) => {
                          const price = Number(s.price) || 0;
                          return acc + price;
                        }, 0), isEnglish)
                      : formatToman(Number(selectedService.price) || 0, isEnglish)}
                  </span>
                </div>
              </div>

              {formData.time && (
                  <div style={{
                    background: 'linear-gradient(135deg, var(--surface-accent) 0%, var(--surface-accent-strong) 100%)',
                    border: '1.5px solid var(--surface-accent-border)',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={20} color="white" />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: 'var(--surface-accent-text)',
                        lineHeight: 1.3
                      }}>
                        {formatBookingDateLabel(formData.time)}
                      </div>
                      <div style={{
                        fontSize: '0.88rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        marginTop: '2px'
                      }}>
                        {isEnglish ? 'Time ' : 'ساعت '} {formatBookingTimeLabel(formData.time)}
                      </div>
                    </div>
                  </div>
                )}
            </Card>
          </motion.div>
        )}

        {/* Modal انتخاب ساعت ── با نمایش وضعیت رزرو */}
        <AnimatePresence>
          {showTimeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimeModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: windowWidth < 768 ? 'flex-end' : 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px'
              }}
            >
              <motion.div
                initial={{ y: windowWidth < 768 ? 400 : 0, opacity: 0, scale: windowWidth < 768 ? 1 : 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: windowWidth < 768 ? 400 : 0, opacity: 0, scale: windowWidth < 768 ? 1 : 0.9 }}
                transition={{ type: 'spring', damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: windowWidth < 768 ? '100%' : '90%',
                  maxWidth: windowWidth < 768 ? '100%' : '500px',
                  background: 'var(--card)',
                  borderRadius: windowWidth < 768 ? '24px 24px 0 0' : '24px',
                  padding: '24px 16px 32px',
                  maxHeight: windowWidth < 768 ? '80vh' : '75vh',
                  overflowY: 'auto',
                  boxShadow: windowWidth < 768 ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: '1.3rem', fontWeight: 700 }}>
                    {t('booking.timeModalTitle', 'Select time')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowTimeModal(false)}
                    style={{
                      background: 'var(--card-hover)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: "var(--text-secondary)",
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--card-hover)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* تاریخ انتخاب‌شده */}
                {formData.date && getSelectedDateInfo() && (
                  <div style={{
                    background: 'linear-gradient(135deg, var(--surface), var(--card-hover))',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                      📅 {getSelectedDateInfo().label}
                    </div>
                  </div>
                )}

                {/* لیست ساعت‌ها ── نمایش همه‌ی slot‌ها با وضعیت رزرو */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {availableTimes.map((slot) => {
                    const isBooked = slot.isBooked;
                    const isSelected = formData.time === slot.value;

                    return (
                      <button
                        type="button"
                        key={slot.value}
                        onClick={() => {
                          if (isBooked) {
                            showDialog(
                              'warning',
                              t('booking.timeBookedTitle', 'This time is booked'),
                              t('booking.timeBookedMessage', 'This time slot has already been booked by another customer. Please choose another time.'),
                              { label: isEnglish ? 'OK' : 'باشه', action: closeDialog }
                            );
                            return;
                          }
                          setFormData(prev => ({ ...prev, time: slot.value }));
                          setShowTimeModal(false);
                          if (errors.start_at) setErrors(prev => ({ ...prev, start_at: '' }));
                          if (error) setError('');
                        }}
                        disabled={false}
                        title={isBooked ? '⛔ این زمان قبلاً رزرو شده است' : ''}
                        style={{
                          padding: '14px 12px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--primary)' : (isBooked ? '2px solid var(--danger-border)' : '2px solid var(--border)'),
                          background: isSelected ? 'var(--info-surface)' : (isBooked ? 'var(--danger-surface)' : 'var(--card)'),
                          color: isSelected ? 'var(--primary)' : (isBooked ? 'var(--danger)' : 'var(--text-primary)'),
                          fontWeight: isSelected ? 700 : (isBooked ? 600 : 600),
                          fontSize: '0.95rem',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          opacity: isBooked ? 0.7 : 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isBooked && !isSelected) {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.background = 'var(--surface-accent)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isBooked && !isSelected) {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.background = 'var(--card)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {slot.label}
                        {isBooked && (
                          <span style={{
                            position: 'absolute',
                            top: '-6px',
                            [isEnglish ? 'left' : 'right']: '-6px',
                            background: '#dc2626',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: 700
                          }}>
                            {t('booking.timeBookedBadge', isEnglish ? 'Booked' : 'گرفته شده')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {availableTimes.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'var(--danger-text)',
                    background: 'var(--danger-surface)',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    {t('booking.noTimeAvailable', 'No available time slots')}
                  </div>
                )}

                {/* دکمه بستن */}
                <button
                  type="button"
                  onClick={() => setShowTimeModal(false)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--card)',
                    border: '2px solid var(--border)',
                    borderRadius: '50px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--info-surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--card)';
                  }}
                >
                  {t('booking.modalClose', 'Close')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── دیالوگ عمومی ─── */}
      {dialog && <BookingDialog dialog={dialog} onClose={closeDialog} language={language} />}

    </motion.div>
  );
}