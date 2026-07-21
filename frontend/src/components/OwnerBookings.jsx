import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { toPersianNumber } from '../utils/formatCurrency';
import { Loading } from './Loading';
import { CheckCircle, XCircle, User, Scissors, Clock, Phone, ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_MAP = {
  pending:   { label: { fa: 'در انتظار', en: 'Pending' }, bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  confirmed: { label: { fa: 'تأیید شده', en: 'Confirmed' }, bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  cancelled: { label: { fa: 'لغو شده', en: 'Cancelled' }, bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

// ============================================================
// کامپوننت دیالوگ مدال
// ============================================================
function DialogModal({ isOpen, onClose, type, title, message, icon, t, language }) {
  const isEnglish = language === 'en';
  const configs = {
    success_confirm: {
      headerBg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      iconBg: 'var(--surface-glass)',
      btnBg: '#059669',
      btnHover: '#047857',
    },
    success_cancel: {
      headerBg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
      iconBg: 'var(--surface-glass)',
      btnBg: '#D97706',
      btnHover: '#B45309',
    },
    error: {
      headerBg: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
      iconBg: 'var(--surface-glass)',
      btnBg: '#DC2626',
      btnHover: '#B91C1C',
    },
  };

  const cfg = configs[type] || configs.error;
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    if (isOpen && type !== 'error') {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* overlay + container برای سنتر کردن */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
          {/* دیالوگ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 400,
              background: 'var(--card)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              direction: isEnglish ? 'ltr' : 'rtl',
              textAlign: isEnglish ? 'left' : 'right',
            }}
          >
            {/* هدر رنگی */}
            <div style={{
              background: cfg.headerBg,
              padding: '1.75rem 1.5rem',
              display: 'flex', alignItems: 'center', gap: 14,
              position: 'relative',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: cfg.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {icon}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>{title}</div>
              </div>
              {/* دکمه بستن */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 12, right: isEnglish ? 12 : undefined, left: isEnglish ? undefined : 12,
                  width: 30, height: 30, borderRadius: 8,
                  border: 'none', background: 'var(--surface-glass-strong)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* بدنه */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: "var(--text-secondary)", fontSize: '0.95rem', lineHeight: 1.8,
                margin: '0 0 1.5rem 0', textAlign: isEnglish ? 'left' : 'center',
              }}>
                {message}
              </p>

              {/* نوار پیشرفت auto-close */}
              <div style={{
                height: 3, background: 'var(--card-hover)', borderRadius: 4,
                marginBottom: '1.25rem', overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                  style={{ height: '100%', borderRadius: 4, background: cfg.btnBg }}
                />
              </div>

              <button
                onClick={onClose}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: 12, border: 'none',
                  background: btnHover ? cfg.btnHover : cfg.btnBg,
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// بقیه کامپوننت‌ها (بدون تغییر)
// ============================================================
function StatusBadge({ status, language }) {
  const s = STATUS_MAP[status] || { label: { fa: status || '—', en: status || '—' }, bg: '#F1F5F9', color: "var(--text-secondary)", dot: '#94A3B8' };
  const label = s.label?.[language] || s.label || status || '—';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      background: s.bg, color: s.color,
      fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.01em'
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function BookingCard({ b, processingId, onConfirm, onCancel, language, t }) {
  const [isHovered, setIsHovered] = useState(false);
  const isPending = b.status === 'pending';
  const isProcessing = processingId === b.id;
  const serviceName = b.services?.length
    ? b.services.map(s => s.name).join(' + ')
    : (b.service?.name || b.service_name || '—');
  const customerName = b.user?.username || b.customer_name || b.customer || '—';
  const phone = b.customer_phone || b.user?.phone_number || b.phone_number || b.phone || '—';
  const time = b.start_at ? new Date(b.start_at).toLocaleString('fa-IR') : '—';

  return (
    <div
      tabIndex={0}
      role="button"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '1.25rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: isHovered
          ? '0 8px 24px rgba(91,79,207,0.16)'
          : (isPending ? '0 0 0 2px #EDE9FE' : '0 1px 4px rgba(0,0,0,0.05)'),
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <User size={18} color="#5B4FCF" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{customerName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{phone}</div>
          </div>
        </div>
        <StatusBadge status={b.status} language={language} />
      </div>

      <div style={{ height: 1, background: 'var(--card-hover)' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Detail icon={<Scissors size={14} />} label={t('bookings.service', 'Service')} value={serviceName} valueColor={'var(--text-primary)'} />
        <Detail icon={<Clock size={14} />} label={t('bookings.time', 'Time')} value={time} valueColor={'var(--text-primary)'} highlightNumbers />
      </div>

      {isPending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <ActionButton
            onClick={() => onConfirm(b.id)}
            disabled={isProcessing}
            color="#fff" bg="#059669" hoverBg="#047857"
            icon={<CheckCircle size={14} />}
            label={isProcessing ? '...' : t('bookings.confirmBookingAction', 'Confirm booking')}
          />
          <ActionButton
            onClick={() => onCancel(b.id)}
            disabled={isProcessing}
            color="#fff" bg="#DC2626" hoverBg="#B91C1C"
            icon={<XCircle size={14} />}
            label={isProcessing ? '...' : t('bookings.cancelBookingAction', 'Cancel booking')}
          />
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value, valueColor, highlightNumbers }) {
  const renderWithNumberColor = (text) => {
    if (!text) return null;
    const parts = [];
    const regex = /([0-9\u06F0-\u06F9]+)/g;
    let lastIndex = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIndex) parts.push({ text: text.slice(lastIndex, m.index), isNumber: false });
      parts.push({ text: m[0], isNumber: true });
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isNumber: false });
    return parts.map((p, i) => (
      <span key={i} style={{ color: p.isNumber && highlightNumbers ? '#ffffff' : valueColor || 'var(--text-primary)' }}>{p.text}</span>
    ));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
      <span style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>
          {highlightNumbers ? renderWithNumberColor(String(value)) : value}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, color, bg, hoverBg, icon, label }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 10, border: 'none',
        background: hover ? hoverBg : bg, color,
        fontSize: '0.82rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'background 0.15s'
      }}
    >
      {icon}{label}
    </button>
  );
}

function Pagination({ current, total, onChange, language }) {
  if (total <= 1) return null;
  const isEnglish = language === 'en';
  const formatNumber = (value) => (isEnglish ? String(value) : toPersianNumber(value));
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: '2rem', flexWrap: 'wrap', direction: 'ltr' }}>
      <PageBtn onClick={() => onChange(current - 1)} disabled={current === 1} icon={<ChevronRight size={15} />} />
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 36, height: 36, borderRadius: 10, border: 'none',
          background: current === p ? '#5B4FCF' : '#F8FAFC',
          color: current === p ? '#fff' : '#64748B',
          fontWeight: current === p ? 700 : 500, fontSize: '0.88rem',
          cursor: 'pointer', transition: 'background 0.15s'
        }}>{formatNumber(p)}</button>
      ))}
      <PageBtn onClick={() => onChange(current + 1)} disabled={current === total} icon={<ChevronLeft size={15} />} />
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: 4 }}>
        {formatNumber(current)} / {formatNumber(total)}
      </span>
    </div>
  );
}

function PageBtn({ onClick, disabled, icon }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
      background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, color: 'var(--text-secondary)'
    }}>{icon}</button>
  );
}

// ============================================================
// کامپوننت اصلی
// ============================================================
export function OwnerBookings({ tenantId }) {
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';

  const formatNumberByLanguage = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return isEnglish ? String(value) : toPersianNumber(value);
  };
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // وضعیت دیالوگ
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'error',       // 'success_confirm' | 'success_cancel' | 'error'
    title: '',
    message: '',
    icon: null,
  });

  const closeDialog = () => setDialog(d => ({ ...d, isOpen: false }));

  const showDialog = (type, title, message) => {
    const icons = {
      success_confirm: <CheckCircle size={28} color="#fff" />,
      success_cancel:  <XCircle size={28} color="#fff" />,
      error:           <AlertCircle size={28} color="#fff" />,
    };
    setDialog({ isOpen: true, type, title, message, icon: icons[type] });
  };

  const ITEMS_PER_PAGE = 9;

  const sortBookings = (arr) => {
    if (!Array.isArray(arr)) return [];
    return [...arr].sort((a, b) => (a?.status === 'pending' ? 0 : 1) - (b?.status === 'pending' ? 0 : 1));
  };

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      try {
        setLoading(true);
        const resp = await api.getBookings(tenantId);
        setBookings(sortBookings(resp.data || []));
        setCurrentPage(1);
      } catch {
        showDialog(
          'error',
          t('common.error', 'Error'),
          t('bookings.loadFailed', 'We could not load the bookings. Please try again.')
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  const handleAction = async (id, action) => {
    if (!tenantId) return;
    setProcessingId(id);
    try {
      const res = await api.bookingAction(tenantId, id, action);
      const updated = res.data;
      setBookings(prev => sortBookings(prev.map(x => x.id === updated.id ? updated : x)));

      if (action === 'confirm') {
        showDialog(
          'success_confirm',
          t('bookings.successConfirmTitle', 'Booking confirmed'),
          t('bookings.successConfirmMessage', 'The booking has been confirmed successfully.')
        );
      } else {
        showDialog(
          'success_cancel',
          t('bookings.successCancelTitle', 'Booking cancelled'),
          t('bookings.successCancelMessage', 'The booking has been cancelled successfully.')
        );
      }
    } catch {
      if (action === 'confirm') {
        showDialog(
          'error',
          t('common.error', 'Error'),
          t('bookings.confirmFailed', 'We could not confirm this booking. Please try again.')
        );
      } else {
        showDialog(
          'error',
          t('common.error', 'Error'),
          t('bookings.cancelFailed', 'We could not cancel this booking. Please try again.')
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (!tenantId) return null;
  if (loading) return <Loading />;

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const paginated = bookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div style={{ direction: isEnglish ? 'ltr' : 'rtl' }}>

      {/* دیالوگ مدال */}
      <DialogModal
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        icon={dialog.icon}
        t={t}
        language={language}
      />

      {/* خلاصه آماری */}
      {bookings.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <StatChip label={t('bookings.totalBookings', 'Total bookings')} value={formatNumberByLanguage(bookings.length)} color="#5B4FCF" bg="#EDE9FE" />
          {pendingCount > 0 && <StatChip label={t('bookings.pendingStatus', 'Pending')} value={formatNumberByLanguage(pendingCount)} color="#92400E" bg="#FEF3C7" />}
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
        }}>
          <Clock size={40} strokeWidth={1.5} />
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>{t('bookings.noBookings', 'No bookings to display')}</div>
          <div style={{ fontSize: '0.85rem' }}>{t('bookings.noBookingsFoundHint', 'Enter your phone number to view your bookings.')}</div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16
          }}>
            {paginated.map(b => (
              <BookingCard
                key={b.id} b={b}
                processingId={processingId}
                onConfirm={(id) => handleAction(id, 'confirm')}
                onCancel={(id) => handleAction(id, 'cancel')}
                language={language}
                t={t}
              />
            ))}
          </div>
          <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} language={language} />
        </>
      )}
    </div>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 20, background: bg
    }}>
      <span style={{ fontWeight: 800, fontSize: '1rem', color }}>{value}</span>
      <span style={{ fontSize: '0.8rem', color, opacity: 0.8 }}>{label}</span>
    </div>
  );
}

export default OwnerBookings;