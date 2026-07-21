import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, Send, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { toPersianNumber } from '../utils/formatCurrency';

/* ── tokens ────────────────────────────────────────────────────────────────── */
const getThemeTokens = (theme) => ({
  purple: theme === 'dark' ? '#8B5CF6' : '#7C5CFC',
  purpleDark: theme === 'dark' ? '#A78BFA' : '#5B3DD8',
  purpleLight: theme === 'dark' ? 'rgba(139,92,246,0.18)' : '#EDE9FF',
  purpleMid: theme === 'dark' ? 'rgba(192,132,252,0.45)' : '#C4B5FD',
  green: '#22C55E',
  greenBg: theme === 'dark' ? 'rgba(34,197,94,0.18)' : '#DCFCE7',
  greenText: theme === 'dark' ? '#86EFAC' : '#15803D',
  amber: '#F59E0B',
  amberLight: theme === 'dark' ? 'rgba(245,158,11,0.2)' : '#FEF3C7',
  ink: theme === 'dark' ? '#F8FAFC' : '#0F172A',
  inkMid: theme === 'dark' ? '#CBD5E1' : '#475569',
  inkLight: theme === 'dark' ? '#94A3B8' : '#94A3B8',
  surface: 'var(--card)',
  bg: 'var(--background)',
  border: 'var(--border)',
  borderLight: theme === 'dark' ? 'rgba(148,163,184,0.2)' : '#F1F5F9',
  radius: '16px',
  radiusSm: '10px',
  shadow: theme === 'dark' ? '0 2px 12px rgba(2,6,23,0.35)' : '0 2px 12px rgba(124,92,252,0.08)',
});

/* ── StarRating ─────────────────────────────────────────────────────────────── */
function StarRating({ value, onChange, size = 28, readonly = false }) {
  const { theme } = useTheme();
  const T = getThemeTokens(theme);
  const [hovered, setHovered] = useState(0);

  return (
    <div
      style={{ display: 'flex', gap: '4px', direction: 'ltr' }}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <motion.button
            key={star}
            type="button"
            whileHover={!readonly ? { scale: 1.2 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: readonly ? 'default' : 'pointer',
              lineHeight: 0,
            }}
            aria-label={readonly ? undefined : `${star} ستاره`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? T.amber : 'none'}
              stroke={filled ? T.amber : T.inkLight}
              strokeWidth="1.5"
              style={{ transition: 'fill 0.15s, stroke 0.15s' }}
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── RatingBar (برای خلاصه امتیازها) ─────────────────────────────────────── */
function RatingBar({ star, count, total }) {
  const { theme } = useTheme();
  const T = getThemeTokens(theme);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr' }}>
      <span style={{ fontSize: '0.75rem', color: T.inkLight, width: '12px', textAlign: 'right' }}>{star}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill={T.amber} stroke={T.amber} strokeWidth="1.5" style={{ flexShrink: 0 }}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
      <div style={{ flex: 1, height: '6px', background: T.borderLight, borderRadius: '99px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          style={{ height: '100%', background: T.amber, borderRadius: '99px' }}
        />
      </div>
      <span style={{ fontSize: '0.75rem', color: T.inkLight, width: '24px' }}>{toPersianNumber(count)}</span>
    </div>
  );
}

/* ── ReviewCard ─────────────────────────────────────────────────────────────── */
function ReviewCard({ review, isOwner, tenantId, onReplySubmit }) {
  const { theme } = useTheme();
  const T = getThemeTokens(theme);
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initials = (review.user_username || 'K')
    .slice(0, 2)
    .toUpperCase();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReplySubmit(review.id, replyText);
      setReplyText('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1.5px solid ${T.border}`,
        padding: '1.25rem',
        direction: 'rtl',
      }}
    >
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* avatar */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: T.purpleLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.purpleDark, fontWeight: 700, fontSize: '0.85rem',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: T.ink }}>
              {review.user_username || 'مشتری'}
            </div>
            <div style={{ fontSize: '0.78rem', color: T.inkLight }}>
              {new Date(review.created_at).toLocaleDateString('fa-IR')}
            </div>
          </div>
        </div>
        <StarRating value={review.rating} size={16} readonly />
      </div>

      {/* text */}
      {review.text && (
        <p style={{ margin: '0 0 0.75rem', color: T.inkMid, fontSize: '0.9rem', lineHeight: 1.7 }}>
          {review.text}
        </p>
      )}

      {/* owner reply */}
      {review.owner_reply && (
        <div style={{
          background: T.purpleLight,
          borderRadius: T.radiusSm,
          padding: '0.75rem 1rem',
          borderRight: `3px solid ${T.purple}`,
          marginTop: '0.75rem',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T.purpleDark, marginBottom: '4px' }}>
            پاسخ سالن
          </div>
          <div style={{ fontSize: '0.88rem', color: T.inkMid, lineHeight: 1.6 }}>
            {review.owner_reply}
          </div>
        </div>
      )}

      {/* owner reply editor */}
      {isOwner && !review.owner_reply && (
        <div style={{ marginTop: '0.75rem' }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none',
              color: T.purple, fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', padding: '4px 0',
            }}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            پاسخ به این نظر
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px', borderRadius: T.radiusSm,
                      border: `1.5px solid ${T.border}`,
                      fontSize: '0.88rem', resize: 'vertical',
                      fontFamily: 'inherit', direction: 'rtl',
                      color: T.ink,
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setOpen(false)}
                      style={{
                        padding: '8px 14px', borderRadius: T.radiusSm,
                        border: `1.5px solid ${T.border}`, background: T.surface,
                        fontSize: '0.85rem', cursor: 'pointer', color: T.inkMid,
                      }}
                    >
                      انصراف
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleReply}
                      disabled={submitting || !replyText.trim()}
                      style={{
                        padding: '8px 16px', borderRadius: T.radiusSm,
                        border: 'none',
                        background: submitting || !replyText.trim() ? T.borderLight : T.purple,
                        color: submitting || !replyText.trim() ? T.inkLight : '#fff',
                        fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'background 0.2s',
                      }}
                    >
                      <Send size={13} />
                      ارسال پاسخ
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

/* ── ReviewForm ─────────────────────────────────────────────────────────────── */
function ReviewForm({ onSubmit, loading }) {
  const { theme } = useTheme();
  const T = getThemeTokens(theme);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('لطفاً یک امتیاز انتخاب کنید'); return; }
    setError('');
    try {
      await onSubmit({ rating, text });
      setRating(0);
      setText('');
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') setError(data);
      else if (data?.detail) setError(data.detail);
      else if (data?.non_field_errors) setError(data.non_field_errors[0]);
      else setError('خطا در ثبت نظر');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1.5px solid ${T.border}`,
        padding: '1.25rem',
        direction: 'rtl',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: T.ink, marginBottom: '1rem' }}>
        نظر خود را ثبت کنید
      </div>

      <form onSubmit={handleSubmit}>
        {/* stars */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.82rem', color: T.inkMid, marginBottom: '8px' }}>امتیاز شما</div>
          <StarRating value={rating} onChange={setRating} size={32} />
        </div>

        {/* text */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="تجربه خود را بنویسید... (اختیاری)"
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', borderRadius: T.radiusSm,
            border: `1.5px solid ${T.border}`,
            fontSize: '0.9rem', resize: 'vertical',
            fontFamily: 'inherit', direction: 'rtl',
            color: T.ink, marginBottom: '0.75rem',
          }}
        />

        {/* error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                color: '#DC2626', fontSize: '0.85rem',
                padding: '8px 12px', background: 'var(--danger-surface)',
                borderRadius: T.radiusSm, marginBottom: '0.75rem',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading || rating === 0}
            style={{
              padding: '10px 22px', borderRadius: T.radiusSm,
              border: 'none',
              background: loading || rating === 0 ? T.borderLight : `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`,
              color: loading || rating === 0 ? T.inkLight : '#fff',
              fontWeight: 700, fontSize: '0.9rem', cursor: loading || rating === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              boxShadow: loading || rating === 0 ? 'none' : '0 4px 14px rgba(124,92,252,0.3)',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            <Send size={15} />
            {loading ? 'در حال ارسال...' : 'ثبت نظر'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

/* ── AlreadyReviewed ────────────────────────────────────────────────────────── */
function AlreadyReviewed() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const T = getThemeTokens(theme);
  const isEnglish = language === 'en';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '1rem 1.25rem',
        background: T.greenBg,
        borderRadius: T.radius,
        border: `1.5px solid #BBF7D0`,
        color: T.greenText,
        fontSize: '0.9rem',
        fontWeight: 600,
        marginBottom: '1.5rem',
        direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right',
      }}
    >
      <CheckCircle size={18} style={{ flexShrink: 0 }} />
      {isEnglish ? 'You have already submitted a review for this salon.' : 'شما قبلاً برای این سالن نظر ثبت کرده‌اید.'}
    </motion.div>
  );
}

/* ── RatingSummary ──────────────────────────────────────────────────────────── */
function RatingSummary({ reviews }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const T = getThemeTokens(theme);
  const isEnglish = language === 'en';
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1.5px solid ${T.border}`,
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        direction: 'rtl',
      }}
    >
      {/* big number */}
      <div style={{ textAlign: 'center', minWidth: '80px' }}>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, color: T.ink, lineHeight: 1 }}>
          {toPersianNumber(avg.toFixed(1))}
        </div>
        <StarRating value={Math.round(avg)} size={14} readonly />
        <div style={{ fontSize: '0.78rem', color: T.inkLight, marginTop: '4px' }}>
          {isEnglish ? `${reviews.length} review${reviews.length === 1 ? '' : 's'}` : `${toPersianNumber(reviews.length)} نظر`}
        </div>
      </div>

      {/* bars */}
      <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {dist.map(({ star, count }) => (
          <RatingBar key={star} star={star} count={count} total={reviews.length} />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Main Reviews Component ─────────────────────────────────────────────────── */
export default function Reviews({ salonId }) {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const T = getThemeTokens(theme);
  const isEnglish = language === 'en';
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const tenantId = salonId || localStorage.getItem('selected_salon_id') || localStorage.getItem('salon_id');

  const isCustomer = user?.role === 'customer';
  const isOwner = user?.role === 'owner' && user?.salon?.id === parseInt(tenantId);
  const hasReviewed = isAuthenticated && reviews.some(r => r.user === user?.id || r.user_username === user?.username);

  useEffect(() => {
    loadReviews();
  }, [tenantId]);

  const loadReviews = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.getReviews(tenantId);
      setReviews(res.data || []);
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async ({ rating, text }) => {
    setSubmitting(true);
    try {
      await api.createReview(tenantId, { rating, text });
      await loadReviews();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerReply = async (reviewId, replyText) => {
    await api.ownerReply(tenantId, reviewId, { owner_reply: replyText });
    await loadReviews();
  };

  return (
    <div style={{ direction: isEnglish ? 'ltr' : 'rtl', textAlign: isEnglish ? 'left' : 'right' }}>
      {/* summary */}
      {!loading && <RatingSummary reviews={reviews} />}

      {/* form zone */}
      {isAuthenticated && isCustomer && (
        hasReviewed
          ? <AlreadyReviewed />
          : <ReviewForm onSubmit={handleSubmit} loading={submitting} />
      )}

      {!isAuthenticated && (
        <div style={{
          padding: '0.9rem 1.25rem',
          background: T.purpleLight,
          borderRadius: T.radius,
          color: T.purpleDark,
          fontSize: '0.88rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          border: `1.5px solid ${T.purpleMid}`,
        }}>
          {isEnglish ? 'Please sign in to submit a review.' : 'برای ثبت نظر ابتدا وارد حساب کاربری خود شوید.'}
        </div>
      )}

      {/* list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: T.inkLight, fontSize: '0.9rem' }}>
          در حال بارگذاری نظرات...
        </div>
      ) : reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center', padding: '2.5rem 1rem',
            background: T.bg, borderRadius: T.radius,
            border: `1.5px dashed ${T.border}`,
          }}
        >
          <MessageSquare size={36} style={{ color: T.purpleMid, marginBottom: '0.75rem' }} />
          <div style={{ color: T.inkMid, fontWeight: 600, marginBottom: '4px' }}>{isEnglish ? 'No reviews yet' : 'هنوز نظری ثبت نشده'}</div>
          <div style={{ color: T.inkLight, fontSize: '0.85rem' }}>{isEnglish ? 'Be the first to leave a review.' : 'اولین نفری باشید که نظر می‌دهد'}</div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <ReviewCard
                  review={review}
                  isOwner={isOwner}
                  tenantId={tenantId}
                  onReplySubmit={handleOwnerReply}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}