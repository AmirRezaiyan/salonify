import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { Loading } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Input } from '../components/Form';
import { toPersianNumber } from '../utils/formatCurrency';
import {
  Calendar,
  Clock,
  Phone,
  User,
  Scissors,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

// ========== توابع کمکی ==========
function useInterval(callback, delay) {
  const savedRef = useRef();
  useEffect(() => {
    savedRef.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay == null) return undefined;
    const id = setInterval(() => savedRef.current?.(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function timeLeft(startAt) {
  if (!startAt) return { finished: false, text: '—', color: '#64748b' };
  const now = new Date();
  const then = new Date(startAt);
  const diff = then - now;
  if (Number.isNaN(then.getTime())) return { finished: false, text: '—', color: '#64748b' };
  if (diff <= 0) return { finished: true, text: 'شروع شده', color: '#10b981' };
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { finished: false, text: `${days} روز`, color: '#10b981' };
  }
  if (hours > 0) {
    return { finished: false, text: `${hours} ساعت و ${minutes} دقیقه`, color: '#3b82f6' };
  }
  return { finished: false, text: `${minutes} دقیقه`, color: '#f59e0b' };
}

function canModifyBookingLocally(booking) {
  if (!booking?.start_at) return false;
  if (booking.status === 'cancelled') return false;
  const diff = new Date(booking.start_at).getTime() - Date.now();
  return diff >= 24 * 60 * 60 * 1000;
}

function getBookingSalonId(booking) {
  if (!booking) return null;

  if (typeof booking.salon === 'number') return booking.salon;
  if (typeof booking.salon === 'string' && booking.salon.trim() !== '') return Number(booking.salon);

  if (booking.salon && typeof booking.salon === 'object') {
    return booking.salon.id ?? booking.salon.pk ?? null;
  }

  if (booking.salon_id) return booking.salon_id;

  return null;
}

function getStatusConfig(status) {
  switch (status) {
    case 'confirmed':
      return { label: 'تأیید شده', color: '#10b981', bg: '#d1fae5', dot: '#10b981', icon: CheckCircle };
    case 'pending':
      return { label: 'در انتظار', color: '#f59e0b', bg: '#fef3c7', dot: '#f59e0b', icon: Clock };
    case 'cancelled':
      return { label: 'لغو شده', color: '#ef4444', bg: '#fee2e2', dot: '#ef4444', icon: XCircle };
    default:
      return { label: status || 'نامشخص', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8', icon: Clock };
  }
}

function sortBookingsList(list) {
  if (!Array.isArray(list)) return [];
  return list.slice().sort((a, b) => {
    const aCan = (a.can_cancel ?? canModifyBookingLocally(a)) && a.status !== 'cancelled';
    const bCan = (b.can_cancel ?? canModifyBookingLocally(b)) && b.status !== 'cancelled';
    if (aCan && !bCan) return -1;
    if (!aCan && bCan) return 1;
    const aTime = a.start_at ? new Date(a.start_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.start_at ? new Date(b.start_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function StatusBadge({ status }) {
  const s = getStatusConfig(status);
  const Icon = s.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        border: `1px solid ${s.color}20`,
      }}
    >
      <Icon size={14} />
      {s.label}
    </span>
  );
}

function StatChip({ label, value, color, bg }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 20,
        background: bg,
        border: `1px solid ${color}18`,
      }}
    >
      <span style={{ fontWeight: 800, fontSize: '1rem', color }}>{value}</span>
      <span style={{ fontSize: '0.8rem', color, opacity: 0.85 }}>{label}</span>
    </div>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
      <span style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{value}</div>
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, color, bg, hoverBg, icon, label }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '7px 12px',
        borderRadius: 10,
        border: 'none',
        background: hover ? hoverBg : bg,
        color,
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function PageBtn({ onClick, disabled, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid #E2E8F0',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        color: '#64748B',
      }}
    >
      {icon}
    </button>
  );
}

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: '2rem',
        flexWrap: 'wrap',
        direction: 'ltr',
      }}
    >
      <PageBtn onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} icon={<ChevronRight size={15} />} />
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: current === p ? '#667eea' : '#F8FAFC',
            color: current === p ? '#fff' : '#64748B',
            fontWeight: current === p ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {toPersianNumber(p)}
        </button>
      ))}
      <PageBtn onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total} icon={<ChevronLeft size={15} />} />
      <span style={{ fontSize: '0.82rem', color: '#94A3B8', marginRight: 4 }}>
        {toPersianNumber(current)} / {toPersianNumber(total)}
      </span>
    </div>
  );
}

function BookingCard({
  booking,
  processingId,
  onConfirm,
  onCancel,
  canManage,
  canCustomerManage,
}) {
  const isPending = booking.status === 'pending';
  const isProcessing = processingId === booking.id;
  const serviceName = booking.services?.length
    ? booking.services.map((s) => s.name).join(' + ')
    : booking.service?.name || booking.service_name || '—';
  const customerName = booking.customer_name || booking.user?.username || booking.customer || '—';
  const phone = booking.customer_phone || booking.user?.phone_number || booking.phone_number || booking.phone || '—';
  const bookingDate = booking.start_at ? new Date(booking.start_at) : null;
  const time = bookingDate ? bookingDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
  const remaining = timeLeft(booking.start_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: isPending ? '0 0 0 2px #EDE9FE' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={18} color="#667eea" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>{customerName}</div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 2 }}>{phone}</div>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div style={{ height: 1, background: '#F1F5F9' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Detail icon={<Scissors size={14} />} label="خدمت" value={serviceName} />
        <Detail icon={<Clock size={14} />} label="زمان" value={time} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 999,
            background: `${remaining.color}12`,
            color: remaining.color,
            border: `1px solid ${remaining.color}25`,
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          <Clock size={14} />
          {remaining.text}
        </span>
        {bookingDate && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 999,
              background: '#F8FAFC',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            {bookingDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        )}
      </div>

      {canManage && isPending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <ActionButton
            onClick={() => onConfirm(booking)}
            disabled={isProcessing}
            color="#059669"
            bg="#D1FAE5"
            hoverBg="#A7F3D0"
            icon={<CheckCircle size={14} />}
            label={isProcessing ? '...' : 'تأیید رزرو'}
          />
          <ActionButton
            onClick={() => onCancel(booking)}
            disabled={isProcessing}
            color="#DC2626"
            bg="#FEE2E2"
            hoverBg="#FECACA"
            icon={<XCircle size={14} />}
            label={isProcessing ? '...' : 'لغو رزرو'}
          />
        </div>
      )}

      {!canManage && canCustomerManage && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <ActionButton
            onClick={() => onCancel(booking)}
            disabled={isProcessing}
            color="#DC2626"
            bg="#FEE2E2"
            hoverBg="#FECACA"
            icon={<XCircle size={14} />}
            label={isProcessing ? '...' : 'لغو نوبت'}
          />
        </div>
      )}

      {!canManage && !canCustomerManage && booking.status !== 'cancelled' && (
        <div
          style={{
            marginTop: 4,
            padding: '10px 12px',
            borderRadius: 12,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: '#64748B',
            fontSize: '0.82rem',
            lineHeight: 1.8,
          }}
        >
          این نوبت دیگر قابل لغو نیست.
        </div>
      )}
    </motion.div>
  );
}

function InfoItem({ icon, label, value, gradient }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: '0.85rem',
            color: '#64748b',
            marginBottom: '4px',
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function CancelConfirmModal({ open, booking, onClose, onConfirm, processing }) {
  if (!open || !booking) return null;

  const serviceName = booking.services?.length
    ? booking.services.map((s) => s.name).join(' + ')
    : booking.service?.name || booking.service_name || '—';

  return (
    <AnimatePresence>
      <motion.div
        key="cancel-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          key="cancel-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '460px',
            background: '#fff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            border: '1px solid #fee2e2',
          }}
        >
          <div
            style={{
              padding: '1.2rem 1.4rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertTriangle size={22} />
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>تأیید لغو نوبت</div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <XCircle size={22} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  مطمئنی که می‌خواهی این نوبت را لغو کنی؟
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.9 }}>
                  این عملیات قابل بازگشت نیست. در صورت لغو، نوبت مربوط به <b>{serviceName}</b> حذف می‌شود.
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '0.9rem 1rem',
                marginBottom: '1.25rem',
                color: '#475569',
                fontSize: '0.9rem',
                lineHeight: 1.8,
              }}
            >
              برای ادامه، دکمه <b>بله، لغو شود</b> را بزن. اگر منصرف شدی، می‌توانی این پنجره را ببندی.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#334155',
                  fontWeight: 700,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.6 : 1,
                }}
              >
                انصراف
              </button>
              <button
                onClick={onConfirm}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontWeight: 700,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.75 : 1,
                  boxShadow: '0 8px 18px rgba(220, 38, 38, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {processing ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    در حال لغو...
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    بله، لغو شود
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SuccessModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="success-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          key="success-modal-card"
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '400px',
            background: '#fff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '1px solid #d1fae5',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '1.5rem 1.4rem 1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <CheckCircle size={36} color="white" />
            </motion.div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065f46', marginBottom: 8 }}>
              عملیات موفق
            </div>
            <div style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              {message}
            </div>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
              }}
            >
              باشه، متوجه شدم
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MyBookings() {
  const { isAuthenticated, user } = useAuth();

  const [phone, setPhone] = useState(localStorage.getItem('customer_phone') || '');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });

  const itemsPerPage = 9;
  const salonId = localStorage.getItem('selected_salon_id') || localStorage.getItem('salon_id') || null;

  const loadBookings = async () => {
    setLoading(true);
    try {
      let res;
      if (isAuthenticated && (user?.role === 'owner' || user?.role === 'staff')) {
        if (!salonId) {
          setBookings([]);
          setError('سالن انتخاب نشده است');
          return;
        }
        res = await api.getBookings(salonId);
        setBookings(Array.isArray(res.data) ? sortBookingsList(res.data) : []);
      } else if (isAuthenticated && user?.role === 'customer') {
        res = await api.getCustomerBookings();
        setBookings(Array.isArray(res.data) ? sortBookingsList(res.data) : []);
      } else if (salonId && phone) {
        res = await api.getBookings(salonId, { params: { customer_phone: phone } });
        setBookings(Array.isArray(res.data) ? sortBookingsList(res.data) : []);
      } else {
        setBookings([]);
      }
      setCurrentPage(1);
      setError('');
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError('خطا در بارگذاری نوبت‌ها');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const performAction = async (booking, action) => {
    const targetSalonId = getBookingSalonId(booking) || salonId;

    if (!targetSalonId) {
      setError('شناسه سالن برای این نوبت پیدا نشد');
      return;
    }

    setProcessingId(booking.id);
    setError('');
    setSuccess('');

    try {
      const res = await api.bookingAction(targetSalonId, booking.id, action);
      const updated = res.data;
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

      // اول مودال رو ببند، بعد پیام موفقیت رو نشون بده
      setCancelTargetBooking(null);

      if (action === 'confirm') {
        setSuccessModal({ open: true, message: 'رزرو با موفقیت تأیید شد.' });
      } else {
        setSuccessModal({ open: true, message: 'نوبت با موفقیت لغو شد.' });
      }
    } catch (err) {
      console.error('Action failed', err);
      setCancelTargetBooking(null);
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'عملیات انجام نشد. دوباره تلاش کنید.');
    } finally {
      setProcessingId(null);
      await loadBookings();
    }
  };

  const requestCancel = (booking) => {
    if (!booking) return;
    setError('');
    setSuccess('');
    setCancelTargetBooking(booking);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetBooking) return;
    await performAction(cancelTargetBooking, 'cancel');
  };

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    setSearchLoading(true);
    localStorage.setItem('customer_phone', phone);
    await loadBookings();
  };

  useInterval(() => {
    setBookings((prev) => [...prev]);
  }, 30000);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const paginatedBookings = bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  if (!isAuthenticated && !salonId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
          padding: '1rem',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            background: 'white',
            borderRadius: '24px',
            padding: '3rem 2rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9',
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          <Calendar size={64} color="#94a3b8" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ color: '#1e293b', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>سالن انتخاب نشده</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>لطفاً ابتدا از صفحه اصلی یک سالن را انتخاب کنید.</p>
          <Button
            onClick={() => (window.location.href = '/')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 32px',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
            }}
          >
            بازگشت به صفحه اصلی
          </Button>
        </div>
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
        background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
        direction: 'rtl',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '3rem 1.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '300px',
            height: '300px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '250px',
            height: '250px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }}
        />
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
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
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
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
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                نوبت‌های من
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  margin: '4px 0 0 0',
                }}
              >
                مشاهده و مدیریت نوبت‌های شما
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              onClick={loadBookings}
              variant="outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '50px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              }}
              disabled={loading || searchLoading}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <RefreshCw size={18} />
              بروزرسانی
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.01 }}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2rem',
              marginBottom: '2.5rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1px solid #f1f5f9',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
                }}
              >
                <Sparkles size={24} />
              </div>
              <h2 style={{ color: '#1e293b', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>اطلاعات حساب کاربری</h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
              }}
            >
              <InfoItem icon={<User size={20} />} label="نام کاربر" value={user.username || user.name || '—'} gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
              <InfoItem icon={<Phone size={20} />} label="شماره موبایل" value={user.phone_number || user.phone || '—'} gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
              <InfoItem icon={<Mail size={20} />} label="ایمیل" value={user.email || '—'} gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 6px 16px rgba(240, 147, 251, 0.3)',
              }}
            >
              <Clock size={24} />
            </div>
            <h2 style={{ color: '#1e293b', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>لیست رزروها</h2>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: '1rem' }}>
                <Alert type="error" message={error} onClose={() => setError('')} />
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: '1rem' }}>
                <Alert type="success" message={success} onClose={() => setSuccess('')} />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                background: '#f8fafc',
                borderRadius: '20px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Search size={20} />
                </div>
                <h3 style={{ color: '#1e293b', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>جستجوی نوبت‌ها</h3>
              </div>
              <form onSubmit={handleSearch}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>
                      شماره موبایل
                    </label>
                    <Input
                      type="tel"
                      placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      icon={<Phone size={18} />}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '14px',
                        fontSize: '0.95rem',
                      }}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={searchLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 32px',
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
                      cursor: searchLoading ? 'not-allowed' : 'pointer',
                      opacity: searchLoading ? 0.7 : 1,
                    }}
                  >
                    {searchLoading ? (
                      <>
                        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        در حال جستجو...
                      </>
                    ) : (
                      <>
                        <Search size={18} />
                        جستجوی نوبت‌ها
                      </>
                    )}
                  </Button>
                </div>
                <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                  برای دسترسی ساده‌تر و مشاهده تمامی نوبت‌ها، وارد حساب کاربری خود شوید.
                </p>
              </form>
            </motion.div>
          )}

          {loading && !bookings.length ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem' }}>
              <Loading />
              <p style={{ marginTop: '1rem', color: '#64748b' }}>در حال بارگذاری نوبت‌ها...</p>
            </motion.div>
          ) : (
            <>
              {bookings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <StatChip label="کل نوبت‌ها" value={toPersianNumber(bookings.length)} color="#667eea" bg="#EDE9FE" />
                  {confirmedCount > 0 && <StatChip label="تأیید شده" value={toPersianNumber(confirmedCount)} color="#065F46" bg="#D1FAE5" />}
                  {pendingCount > 0 && <StatChip label="در انتظار" value={toPersianNumber(pendingCount)} color="#92400E" bg="#FEF3C7" />}
                  {cancelledCount > 0 && <StatChip label="لغو شده" value={toPersianNumber(cancelledCount)} color="#991B1B" bg="#FEE2E2" />}
                </motion.div>
              )}

              {bookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: '#f8fafc',
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Clock size={64} style={{ color: '#94a3b8', marginBottom: '1.5rem' }} />
                  <h3 style={{ color: '#475569', fontSize: '1.5rem', marginBottom: '0.5rem' }}>نوبتی یافت نشد</h3>
                  <p style={{ color: '#64748b' }}>
                    {!isAuthenticated && !phone
                      ? 'برای مشاهده نوبت‌های خود، شماره موبایل خود را وارد کنید.'
                      : 'شما هنوز نوبتی ثبت نکرده‌اید یا نوبتی با این مشخصات وجود ندارد.'}
                  </p>
                </motion.div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                  }}
                >
                  {paginatedBookings.map((booking) => {
                    const customerCanManage =
                      isAuthenticated &&
                      user?.role === 'customer' &&
                      (booking.can_cancel ?? canModifyBookingLocally(booking));

                    return (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        processingId={processingId}
                        canManage={isAuthenticated && (user?.role === 'owner' || user?.role === 'staff')}
                        canCustomerManage={customerCanManage}
                        onConfirm={(b) => performAction(b, 'confirm')}
                        onCancel={(b) => requestCancel(b)}
                      />
                    );
                  })}
                </div>
              )}
              <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
            </>
          )}
        </motion.div>
      </div>

      <CancelConfirmModal
        open={!!cancelTargetBooking}
        booking={cancelTargetBooking}
        onClose={() => setCancelTargetBooking(null)}
        onConfirm={handleConfirmCancel}
        processing={processingId === cancelTargetBooking?.id}
      />

      <SuccessModal
        open={successModal.open}
        message={successModal.message}
        onClose={() => setSuccessModal({ open: false, message: '' })}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}