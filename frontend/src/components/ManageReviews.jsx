import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Star, Send, X, MessageCircle, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { toPersianNumber } from '../utils/formatCurrency';

/* ── tokens (هماهنگ با PortfolioManager) ──────────────────────────────── */
const T = {
  purple: 'var(--primary)',
  purpleDark: 'var(--primary-dark)',
  purpleLight: 'var(--surface-glass)',
  purpleMid: 'var(--primary-light)',
  amber: 'var(--warning)',
  amberBg: 'var(--warning-surface)',
  green: 'var(--success)',
  greenBg: 'var(--success-surface)',
  greenText: 'var(--success)',
  red: 'var(--danger)',
  redBg: 'var(--danger-surface)',
  redText: 'var(--danger)',
  ink: 'var(--text-primary)',
  inkMid: 'var(--text-secondary)',
  inkLight: 'var(--text-muted)',
  surface: 'var(--card)',
  bg: 'var(--surface)',
  border: 'var(--border)',
  borderLight: 'var(--border-muted)',
  radius: '16px',
  radiusSm: '10px',
  shadow: 'var(--shadow-md)',
  shadowHover: 'var(--shadow-lg)',
};

const PAGE_SIZE = 8;

/* ── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isError = type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, maxWidth: '420px', width: 'calc(100% - 32px)',
        background: T.surface,
        borderRadius: T.radius,
        border: `1.5px solid ${isError ? 'var(--danger)' : 'var(--success)'}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        padding: '0.9rem 1.1rem',
        display: 'flex', alignItems: 'center', gap: '10px',
        direction: 'ltr',
        textAlign: 'left',
      }}
    >
      {isError
        ? <AlertCircle size={18} style={{ color: T.red, flexShrink: 0 }} />
        : <CheckCircle size={18} style={{ color: T.green, flexShrink: 0 }} />
      }
      <span style={{ color: isError ? T.redText : T.greenText, fontWeight: 600, fontSize: '0.88rem', flex: 1 }}>
        {message}
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkLight, flexShrink: 0 }}>
        <X size={15} />
      </button>
    </motion.div>
  );
}

/* ── StarRow ────────────────────────────────────────────────────────────── */
function StarRow({ rating, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          style={{
            color: s <= rating ? T.amber : T.borderLight,
            fill: s <= rating ? T.amber : 'transparent',
          }}
        />
      ))}
    </div>
  );
}

/* ── SummaryBar: میانگین امتیاز + تعداد ──────────────────────────────── */
function SummaryBar({ reviews, isEnglish, t }) {
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: T.surface, borderRadius: '20px',
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadow, overflow: 'hidden',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${T.purple}, ${T.purpleDark})` }} />
      <div style={{
        padding: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1.25rem',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: T.purpleLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <MessageCircle size={24} style={{ color: T.purple }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: T.ink, lineHeight: 1 }}>
              {toPersianNumber(avg.toFixed(1))}
            </span>
            <StarRow rating={Math.round(avg)} size={15} />
          </div>
          <span style={{ fontSize: '0.85rem', color: T.inkLight, fontWeight: 600 }}>
            {t('manageReviews.average', 'Average rating from {count} reviews', { count: isEnglish ? total : toPersianNumber(total) })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── ReplyBox ───────────────────────────────────────────────────────────── */
function ReplyBox({ review, onCancel, onSend, sending, t }) {
  const [text, setText] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        background: T.bg,
        border: `1.5px solid ${T.purpleMid}`,
        borderRadius: T.radiusSm,
        padding: '1rem',
        marginTop: '0.9rem',
      }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: T.inkMid, marginBottom: '6px' }}>
          {t('manageReviews.replyLabel', 'Your reply')}
        </label>
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('manageReviews.replyPlaceholder', 'Write your reply to this review...')}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 12px', borderRadius: T.radiusSm,
            border: `1.5px solid ${T.border}`,
            fontSize: '0.9rem', fontFamily: 'inherit', color: T.ink,
            resize: 'vertical', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = T.purple}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: T.radiusSm,
              border: `1.5px solid ${T.border}`, background: T.surface,
              color: T.inkMid, fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer',
            }}
          >
            {t('manageReviews.cancel', 'Cancel')}
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onSend(text)}
            disabled={sending}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: T.radiusSm,
              border: 'none',
              background: sending ? T.purpleMid : `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`,
              color: 'var(--text-light)', fontWeight: 700, fontSize: '0.86rem',
              cursor: sending ? 'wait' : 'pointer',
              boxShadow: sending ? 'none' : '0 4px 14px rgba(124,92,252,0.3)',
            }}
          >
            <Send size={14} />
            {sending ? t('manageReviews.sending', 'Sending...') : t('manageReviews.send', 'Send reply')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── ReviewCard ─────────────────────────────────────────────────────────── */
function ReviewCard({ review, index, onReply, replyOpen, onToggleReply, sending, t }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        background: T.surface,
        border: `1.5px solid ${T.border}`,
        borderRadius: T.radius,
        padding: '1.25rem 1.4rem',
        boxShadow: T.shadow,
      }}
    >
      {/* header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '0.9rem', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: T.purpleLight, color: T.purpleDark,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.95rem', flexShrink: 0,
          }}>
            {(review.user_username || 'ک')[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: T.ink, fontSize: '0.95rem' }}>
              {review.user_username || t('manageReviews.userFallback', 'User')}
            </div>
            <div style={{ color: T.inkLight, fontSize: '0.78rem', marginTop: '1px' }}>
              {new Date(review.created_at).toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      {/* متن نظر */}
      {review.text && (
        <div style={{
          color: T.inkMid, fontSize: '0.92rem', lineHeight: 1.7,
          marginBottom: '0.9rem',
          background: T.bg,
          padding: '0.8rem 1rem',
          borderRadius: T.radiusSm,
          borderRight: `3px solid ${T.purple}`,
        }}>
          {review.text}
        </div>
      )}

      {/* پاسخ مالک */}
      {review.owner_reply ? (
        <div style={{
          background: T.purpleLight,
          border: `1.5px solid ${T.purpleMid}`,
          borderRadius: T.radiusSm,
          padding: '0.9rem 1rem',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontWeight: 700, color: T.purpleDark, marginBottom: '5px', fontSize: '0.85rem',
          }}>
            <CheckCircle size={14} />
            {t('manageReviews.send', 'Send reply')}
          </div>
          <div style={{ color: T.ink, fontSize: '0.9rem', lineHeight: 1.6 }}>
            {review.owner_reply}
          </div>
          {review.owner_reply_at && (
            <div style={{ color: T.purple, fontSize: '0.76rem', marginTop: '6px' }}>
              {new Date(review.owner_reply_at).toLocaleString('fa-IR')}
            </div>
          )}
        </div>
      ) : (
        <>
          {!replyOpen ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onToggleReply}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: T.radiusSm,
                border: `1.5px solid ${T.purpleMid}`, background: T.purpleLight,
                color: T.purpleDark, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Send size={14} />
              {t('manageReviews.send', 'Send reply')}
            </motion.button>
          ) : (
            <ReplyBox
              review={review}
              onCancel={onToggleReply}
              onSend={onReply}
              sending={sending}
              t={t}
            />
          )}
        </>
      )}
    </motion.div>
  );
}

/* ── Pagination ─────────────────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '6px', marginTop: '1.5rem', flexWrap: 'wrap',
    }}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{
          width: '34px', height: '34px', borderRadius: '10px',
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: page === 1 ? T.inkLight : T.purpleDark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: page === 1 ? 'not-allowed' : 'pointer',
          opacity: page === 1 ? 0.5 : 1,
        }}
      >
        <ChevronRight size={16} />
      </motion.button>

      {pages.map(p => (
        <motion.button
          key={p}
          whileTap={{ scale: 0.92 }}
          onClick={() => onChange(p)}
          style={{
            minWidth: '34px', height: '34px', borderRadius: '10px',
            border: `1.5px solid ${p === page ? T.purple : T.border}`,
            background: p === page ? `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})` : T.surface,
            color: p === page ? 'var(--text-light)' : T.inkMid,
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            padding: '0 8px',
            boxShadow: p === page ? '0 4px 12px rgba(124,92,252,0.3)' : 'none',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {toPersianNumber(p)}
        </motion.button>
      ))}

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        style={{
          width: '34px', height: '34px', borderRadius: '10px',
          border: `1.5px solid ${T.border}`, background: T.surface,
          color: page === totalPages ? T.inkLight : T.purpleDark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: page === totalPages ? 'not-allowed' : 'pointer',
          opacity: page === totalPages ? 0.5 : 1,
        }}
      >
        <ChevronLeft size={16} />
      </motion.button>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export default function ManageReviews({ salonId }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [replyOpenId, setReplyOpenId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [page, setPage] = useState(1);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    loadReviews();
  }, [salonId]);

  const loadReviews = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const res = await api.getReviews(salonId);
      setReviews(res.data || []);
    } catch (e) {
      console.error('Failed to load reviews', e);
      showToast(t('manageReviews.replyError', 'Failed to send reply'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerReply = async (reviewId, text) => {
    const rText = text?.trim();
    if (!rText) {
      showToast(t('manageReviews.replyEmpty', 'Reply message cannot be empty'), 'error');
      return;
    }

    setSendingId(reviewId);
    try {
      await api.ownerReply(salonId, reviewId, { owner_reply: rText });
      setReplyOpenId(null);
      showToast(t('manageReviews.replySuccess', 'Reply sent successfully'));
      await loadReviews();
    } catch (err) {
      console.error('reply error', err);
      showToast(t('manageReviews.replyError', 'Failed to send reply') + ': ' + (err.response?.data?.detail || t('common.error', 'Error')), 'error');
    } finally {
      setSendingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const pagedReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return reviews.slice(start, start + PAGE_SIZE);
  }, [reviews, page]);

  const handlePageChange = (p) => {
    setPage(p);
    setReplyOpenId(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: T.inkLight }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', marginBottom: '12px' }}
        >
          <MessageCircle size={32} style={{ color: T.purpleMid }} />
        </motion.div>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  return (
    <div style={{ direction: isEnglish ? 'ltr' : 'rtl', textAlign: isEnglish ? 'left' : 'right' }}>
      <AnimatePresence>
        {toast && (
          <Toast key="toast" message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      {reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center', padding: '3rem 1.5rem',
            background: T.surface, borderRadius: '20px',
            border: `2px dashed ${T.border}`,
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Star size={48} style={{ color: T.purpleMid, marginBottom: '1rem' }} />
          </motion.div>
          <h3 style={{ color: T.inkMid, fontWeight: 700, margin: '0 0 6px' }}>
            {t('manageReviews.empty', 'No reviews yet')}
          </h3>
          <p style={{ color: T.inkLight, margin: 0, fontSize: '0.88rem' }}>
            {t('manageReviews.emptyHint', 'When customers leave a review, it will appear here')}
          </p>
        </motion.div>
      ) : (
        <>
          <SummaryBar reviews={reviews} isEnglish={isEnglish} t={t} />

          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'grid', gap: '1rem' }}
            >
              <AnimatePresence>
                {pagedReviews.map((review, index) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    index={index}
                    replyOpen={replyOpenId === review.id}
                    sending={sendingId === review.id}
                    onToggleReply={() =>
                      setReplyOpenId(prev => (prev === review.id ? null : review.id))
                    }
                    onReply={(text) => handleOwnerReply(review.id, text)}
                    t={t}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
        </>
      )}
    </div>
  );
}