import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Upload, Image as ImageIcon,
  AlertCircle, CheckCircle, X, FolderOpen, ChevronDown, ChevronUp,
  Maximize2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

/* ── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  purple: 'var(--primary)',
  purpleDark: 'var(--primary-dark)',
  purpleLight: 'var(--surface-glass)',
  purpleMid: 'var(--primary-light)',
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_NAME_LENGTH = 50;
const MAX_CATEGORIES = 10;

/* ── SuccessModal (دیالوگ موفقیت) ──────────────────────────────────────── */
function SuccessModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(440px, calc(100vw - 1.5rem))',
              maxWidth: '95vw',
              background: 'var(--card)',
              borderRadius: '24px',
              boxShadow: '0 24px 90px rgba(15, 23, 42, 0.35)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              textAlign: 'center',
              direction: 'rtl',
            }}
          >
            <div style={{
              height: '4px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }} />
            <div style={{ padding: '2rem 1.5rem 1.75rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{
                color: "var(--text-primary)",
                fontSize: '1.15rem',
                fontWeight: 800,
                margin: '0 0 0.6rem',
              }}>
                {title || 'موفقیت'}
              </h3>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: '0.95rem',
                lineHeight: 1.7,
                margin: '0 0 1.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {message}
              </p>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                متوجه شدم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── ErrorModal (دیالوگ خطا) ───────────────────────────────────────────── */
function ErrorModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(440px, calc(100vw - 1.5rem))',
              maxWidth: '95vw',
              background: 'var(--card)',
              borderRadius: '24px',
              boxShadow: '0 24px 90px rgba(15, 23, 42, 0.35)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              textAlign: 'center',
              direction: 'rtl',
            }}
          >
            <div style={{
              height: '4px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            }} />
            <div style={{ padding: '2rem 1.5rem 1.75rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--danger-surface)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <AlertCircle size={28} />
              </div>
              <h3 style={{
                color: "var(--text-primary)",
                fontSize: '1.15rem',
                fontWeight: 800,
                margin: '0 0 0.6rem',
              }}>
                {title || 'خطا'}
              </h3>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: '0.95rem',
                lineHeight: 1.7,
                margin: '0 0 1.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {message}
              </p>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                متوجه شدم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── ConfirmDialog ───────────────────────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface, borderRadius: '20px',
          padding: '1.75rem', maxWidth: '380px', width: '100%',
          boxSizing: 'border-box',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          direction: 'rtl',
        }}
      >
        <p style={{ color: T.ink, fontWeight: 600, fontSize: '0.95rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 18px', borderRadius: T.radiusSm,
            border: `1.5px solid ${T.border}`, background: T.surface,
            color: T.inkMid, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
          }}>
            انصراف
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: T.radiusSm,
              border: 'none', background: T.red,
              color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            }}
          >
            حذف
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── ImageModal ──────────────────────────────────────────────────────────── */
function ImageModal({ image, title, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 9997,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: 'var(--card)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          cursor: 'default',
        }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={image}
          alt={title || 'نمونه کار'}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            maxWidth: '90vw',
            maxHeight: '80vh',
            objectFit: 'contain',
          }}
        />
        {title && (
          <div style={{
            padding: '0.75rem 1rem',
            textAlign: 'center',
            borderTop: '1px solid #eee',
            color: T.ink,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            {title}
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          <X size={24} />
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── ImageCard ───────────────────────────────────────────────────────────── */
function ImageCard({ item, onDelete, index }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.85, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -12 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: index * 0.04 }}
        className="portfolio-item-card"
        style={{
          borderRadius: T.radius,
          overflow: 'hidden',
          background: T.surface,
          border: `1.5px solid ${T.border}`,
          boxShadow: T.shadow,
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          aspectRatio: '4/3',
        }}
      >
        <div
          className="portfolio-item-media"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minWidth: 0,
            maxWidth: '100%',
            background: T.bg,
            cursor: 'pointer',
          }}
          onClick={() => setShowModal(true)}
        >
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          >
            <Maximize2 size={14} />
          </div>

          <motion.button
            whileHover={{ scale: 1.1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            style={{
              position: 'absolute', top: '8px', left: '8px',
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.85)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              opacity: 0.85,
              transition: 'opacity 0.2s, transform 0.2s',
              backdropFilter: 'blur(2px)',
            }}
            className="delete-btn-always"
            title="حذف عکس"
          >
            <Trash2 size={16} color="#fff" />
          </motion.button>
        </div>
        <div
          className="portfolio-item-title"
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: T.inkMid,
            overflow: 'hidden',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            lineHeight: 1.45,
            minWidth: 0,
          }}
        >
          {item.title || 'بدون عنوان'}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ImageModal
            image={item.image}
            title={item.title}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── UploadZone ──────────────────────────────────────────────────────────── */
function UploadZone({ categoryId, onUpload, uploading, itemCount }) {
  const fileRef = useRef(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const [open, setOpen] = useState(false);

  const isFull = itemCount >= 5;

  const validate = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'فقط JPG، PNG، WebP و GIF پذیرفته می‌شوند';
    if (file.size > MAX_FILE_SIZE) return 'حداکثر حجم: ۵ مگابایت';
    if (!title.trim()) return 'عنوان عکس را وارد کنید';
    if (title.trim().length > MAX_TITLE_LENGTH) return `عنوان نباید بیشتر از ${MAX_TITLE_LENGTH} کاراکتر باشد`;
    if (desc.length > MAX_DESCRIPTION_LENGTH) return `توضیحات نباید بیشتر از ${MAX_DESCRIPTION_LENGTH} کاراکتر باشد`;
    return null;
  };

  const submit = async (file) => {
    if (isFull) {
      setLocalError('تعداد عکس‌های این دسته به حداکثر (۵ عدد) رسیده است.');
      return;
    }
    const err = validate(file);
    if (err) { setLocalError(err); return; }
    setLocalError('');

    const formData = new FormData();
    formData.append('title', title.trim());
    if (desc.trim()) formData.append('description', desc.trim());
    formData.append('image', file);

    const ok = await onUpload(categoryId, formData);
    if (ok) {
      setTitle('');
      setDesc('');
      setOpen(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) submit(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) submit(file);
  };

  return (
    <div className="portfolio-upload-shell" style={{ marginBottom: '1.5rem', direction: 'rtl', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isFull}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem',
          background: isFull ? 'var(--card-hover)' : T.purpleLight,
          borderRadius: open ? `${T.radiusSm} ${T.radiusSm} 0 0` : T.radiusSm,
          border: `1.5px solid ${isFull ? 'var(--border)' : T.purpleMid}`,
          cursor: isFull ? 'not-allowed' : 'pointer',
          color: isFull ? T.inkLight : T.purpleDark,
          fontWeight: 700, fontSize: '0.9rem',
          transition: 'border-radius 0.2s',
          opacity: isFull ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          افزودن عکس جدید
          {isFull && <span style={{ fontSize: '0.75rem', color: T.red, marginRight: '8px' }}>(تکمیل شده)</span>}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence>
        {open && !isFull && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="portfolio-uploader-pane" style={{
              background: T.surface,
              border: `1.5px solid ${T.purpleMid}`,
              borderTop: 'none',
              borderRadius: `0 0 ${T.radiusSm} ${T.radiusSm}`,
              padding: '1.25rem',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: T.inkMid, marginBottom: '5px' }}>
                  عنوان عکس <span style={{ color: T.red }}>*</span>
                  <span style={{ color: T.inkLight, fontWeight: 400, marginRight: '8px' }}>
                    (حداکثر {MAX_TITLE_LENGTH} کاراکتر)
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    const val = e.target.value.slice(0, MAX_TITLE_LENGTH);
                    setTitle(val);
                  }}
                  placeholder="مثال: اصلاح مو کوتاه"
                  maxLength={MAX_TITLE_LENGTH}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '9px 12px', borderRadius: T.radiusSm,
                    border: `1.5px solid ${T.border}`,
                    fontSize: '0.9rem', fontFamily: 'inherit', color: T.ink,
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = T.purple}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                <div style={{ fontSize: '0.75rem', color: T.inkLight, marginTop: '4px', textAlign: 'left' }}>
                  {title.length}/{MAX_TITLE_LENGTH}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: T.inkMid, marginBottom: '5px' }}>
                  توضیح <span style={{ color: T.inkLight, fontWeight: 400 }}>(اختیاری، حداکثر {MAX_DESCRIPTION_LENGTH} کاراکتر)</span>
                </label>
                <textarea
                  value={desc}
                  onChange={e => {
                    const val = e.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
                    setDesc(val);
                  }}
                  rows={2}
                  placeholder="توضیح کوتاه..."
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '9px 12px', borderRadius: T.radiusSm,
                    border: `1.5px solid ${T.border}`,
                    fontSize: '0.9rem', fontFamily: 'inherit',
                    color: T.ink, resize: 'vertical',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = T.purple}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                <div style={{ fontSize: '0.75rem', color: T.inkLight, marginTop: '4px', textAlign: 'left' }}>
                  {desc.length}/{MAX_DESCRIPTION_LENGTH}
                </div>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? T.purple : T.purpleMid}`,
                  borderRadius: T.radiusSm,
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? T.purpleLight : T.bg,
                  transition: 'all 0.2s',
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onFileChange}
                  style={{ display: 'none' }}
                />
                {uploading
                  ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block', marginBottom: '8px' }}
                    >
                      <Upload size={28} style={{ color: T.purple }} />
                    </motion.div>
                  )
                  : <Upload size={28} style={{ color: T.purple, marginBottom: '8px' }} />
                }
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: T.purpleDark, fontSize: '0.88rem' }}>
                  {uploading ? 'در حال آپلود...' : 'کلیک کنید یا فایل را اینجا بکشید'}
                </p>
                <p style={{ margin: 0, color: T.inkLight, fontSize: '0.78rem' }}>
                  JPG, PNG, WebP, GIF — حداکثر ۵ مگابایت
                </p>
              </div>

              <AnimatePresence>
                {localError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ color: T.redText, fontSize: '0.82rem', margin: '8px 0 0', fontWeight: 600 }}
                  >
                    {localError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── CategoryCard ────────────────────────────────────────────────────────── */
function CategoryCard({ category, onDelete, onUpload, uploadingId, onDeleteItem, index }) {
  const [expanded, setExpanded] = useState(true);
  const itemCount = category.items?.length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="portfolio-category-card"
      style={{
        background: T.surface,
        borderRadius: '20px',
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadow,
        overflow: 'hidden',
        direction: 'rtl',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${T.purple}, ${T.purpleDark})` }} />

      <div className="portfolio-category-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 1.25rem',
        gap: '0.75rem',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}>
        <button
          onClick={() => setExpanded(v => !v)}
          className="portfolio-category-toggle"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'right', flex: '1 1 280px',
            minWidth: 0,
            maxWidth: '100%',
            width: '100%',
          }}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: T.purpleLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FolderOpen size={18} style={{ color: T.purple }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 700,
              color: T.ink,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {category.name}
            </h3>
            {category.description && (
              <p style={{
                margin: '2px 0 0',
                fontSize: '0.8rem',
                color: T.inkLight,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px',
              }}>
                {category.description}
              </p>
            )}
          </div>
          <div style={{
            marginRight: 'auto', marginLeft: '4px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{
              background: itemCount >= 5 ? '#fef3c7' : T.purpleLight,
              color: itemCount >= 5 ? '#92400e' : T.purpleDark,
              fontSize: '0.75rem', fontWeight: 700, padding: '2px 9px',
              borderRadius: '999px',
            }}>
              {itemCount}/۵ عکس
            </span>
            {expanded ? <ChevronUp size={16} style={{ color: T.inkLight }} /> : <ChevronDown size={16} style={{ color: T.inkLight }} />}
          </div>
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => onDelete(category.id)}
          className="portfolio-delete-action"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '7px 14px', borderRadius: T.radiusSm,
            border: `1.5px solid #FECACA`, background: T.surface,
            color: T.redText, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.redBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surface; }}
        >
          <Trash2 size={13} />
          حذف دسته
        </motion.button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="portfolio-category-content"
            style={{ overflow: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0 }}
          >
            <div style={{ padding: '0 1.25rem 1.25rem', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <UploadZone
                categoryId={category.id}
                onUpload={onUpload}
                uploading={uploadingId === category.id}
                itemCount={itemCount}
              />

              {itemCount > 0 ? (
                <AnimatePresence>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '1rem',
                      width: '100%',
                      minWidth: 0,
                    }}
                    className="portfolio-grid"
                  >
                    {category.items.map((item, i) => (
                      <ImageCard key={item.id} item={item} onDelete={onDeleteItem} index={i} />
                    ))}
                  </div>
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    textAlign: 'center', padding: '2rem 1rem',
                    background: T.bg, borderRadius: T.radiusSm,
                    border: `1.5px dashed ${T.border}`,
                  }}
                >
                  <ImageIcon size={36} style={{ color: T.purpleMid, marginBottom: '8px' }} />
                  <p style={{ color: T.inkMid, fontWeight: 600, margin: '0 0 3px', fontSize: '0.88rem' }}>هنوز عکسی اضافه نشده</p>
                  <p style={{ color: T.inkLight, margin: 0, fontSize: '0.8rem' }}>از فرم بالا عکس اضافه کنید</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function PortfolioManager({ salonId }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [successModal, setSuccessModal] = useState({ open: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' });

  const actualSalonId = salonId || user?.salon?.id;

  const showSuccessModal = (title, message) => {
    setSuccessModal({ open: true, title, message });
  };

  const showErrorModal = (title, message) => {
    setErrorModal({ open: true, title, message });
  };

  useEffect(() => {
    if (actualSalonId) fetchCategories();
  }, [actualSalonId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getPortfolioCategories(actualSalonId);
      setCategories(res.data || []);
    } catch (err) {
      showErrorModal('خطا در بارگذاری', err.response?.status === 401 ? 'احراز هویت ناموفق' : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    const trimmedName = newName.trim();
    if (!trimmedName) {
      showErrorModal('خطا', 'لطفاً نام دسته‌بندی را وارد کنید');
      return;
    }
    if (trimmedName.length > MAX_CATEGORY_NAME_LENGTH) {
      showErrorModal('خطا', `نام دسته‌بندی نباید بیشتر از ${MAX_CATEGORY_NAME_LENGTH} کاراکتر باشد`);
      return;
    }
    if (newDesc.length > MAX_DESCRIPTION_LENGTH) {
      showErrorModal('خطا', `توضیحات نباید بیشتر از ${MAX_DESCRIPTION_LENGTH} کاراکتر باشد`);
      return;
    }

    if (categories.length >= MAX_CATEGORIES) {
      showErrorModal('خطا', `حداکثر ${MAX_CATEGORIES} دسته‌بندی مجاز است.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.createPortfolioCategory(actualSalonId, {
        name: trimmedName,
        description: newDesc.trim()
      });
      setNewName('');
      setNewDesc('');
      showSuccessModal('موفقیت', 'دسته‌بندی با موفقیت ایجاد شد');
      fetchCategories();
    } catch (err) {
      let errorMessage = 'خطا در ایجاد دسته‌بندی';

      if (err.response) {
        const data = err.response.data;
        if (typeof data === 'string') errorMessage = data;
        else if (data.name) errorMessage = data.name;
        else if (data.detail) errorMessage = data.detail;
        else if (data.message) errorMessage = data.message;
        else if (data.non_field_errors) errorMessage = data.non_field_errors.join(' ');
        else if (data.error) errorMessage = data.error;
        else if (data.errors && typeof data.errors === 'object') {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey) {
            const firstError = data.errors[firstKey];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      showErrorModal('خطا در ایجاد دسته‌بندی', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = (id) => {
    setConfirm({
      message: 'دسته‌بندی و تمام عکس‌های آن حذف خواهند شد. مطمئنید؟',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.deletePortfolioCategory(id);
          showSuccessModal('موفقیت', 'دسته‌بندی با موفقیت حذف شد');
          fetchCategories();
        } catch (err) {
          let msg = 'خطا در حذف دسته‌بندی';
          if (err.response?.data?.detail) msg = err.response.data.detail;
          else if (err.response?.data?.message) msg = err.response.data.message;
          showErrorModal('خطا', msg);
        }
      },
    });
  };

  const handleUpload = async (categoryId, formData) => {
    setUploadingId(categoryId);
    try {
      await api.createPortfolioItem(categoryId, formData);
      showSuccessModal('موفقیت', 'عکس با موفقیت آپلود شد');
      fetchCategories();
      return true;
    } catch (err) {
      let msg = 'خطا در آپلود عکس';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') msg = data;
        else if (data.category) msg = data.category;
        else if (data.detail) msg = data.detail;
        else if (data.image) msg = data.image;
        else if (data.message) msg = data.message;
        else if (data.non_field_errors) msg = data.non_field_errors.join(' ');
      } else if (err.message) {
        msg = err.message;
      }
      showErrorModal('خطا در آپلود عکس', msg);
      return false;
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteItem = (itemId) => {
    setConfirm({
      message: 'این عکس حذف خواهد شد. مطمئنید؟',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.deletePortfolioItem(itemId);
          showSuccessModal('موفقیت', 'عکس با موفقیت حذف شد');
          fetchCategories();
        } catch (err) {
          let msg = 'خطا در حذف عکس';
          if (err.response?.data?.detail) msg = err.response.data.detail;
          else if (err.response?.data?.message) msg = err.response.data.message;
          showErrorModal('خطا', msg);
        }
      },
    });
  };

  return (
    <div className="portfolio-manager-root" style={{ direction: 'rtl', minHeight: '200px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden' }}>
      <style>{`
        .portfolio-manager-root * { box-sizing: border-box; }
        .portfolio-manager-root {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: hidden;
          overflow: hidden;
          flex: 1 1 100%;
        }
        .portfolio-manager-root .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          width: 100%;
          min-width: 0;
        }
        .portfolio-manager-root .portfolio-item-card,
        .portfolio-manager-root .portfolio-category-card,
        .portfolio-manager-root .portfolio-upload-shell,
        .portfolio-manager-root .portfolio-uploader-pane,
        .portfolio-manager-root .portfolio-category-header,
        .portfolio-manager-root .portfolio-category-content,
        .portfolio-manager-root .portfolio-category-toggle,
        .portfolio-manager-root .portfolio-delete-action,
        .portfolio-manager-root .portfolio-item-media,
        .portfolio-manager-root .portfolio-item-title {
          min-width: 0;
          max-width: 100%;
          width: 100%;
        }
        .portfolio-manager-root .portfolio-category-toggle {
          flex: 1 1 280px;
        }
        @media (max-width: 900px) {
          .portfolio-manager-root .portfolio-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.85rem !important;
          }
          .portfolio-manager-root .portfolio-category-header {
            padding: 1rem 1rem 0.9rem !important;
          }
        }
        @media (max-width: 600px) {
          .portfolio-manager-root .portfolio-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 0.75rem !important;
          }
          .portfolio-manager-root .portfolio-category-header {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 0.95rem 0.95rem 0.8rem !important;
          }
          .portfolio-manager-root .portfolio-category-toggle {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .portfolio-manager-root .portfolio-delete-action {
            width: 100% !important;
            justify-content: center !important;
          }
          .portfolio-manager-root .portfolio-uploader-pane {
            padding: 0.95rem !important;
          }
          .portfolio-manager-root .portfolio-item-title {
            font-size: 0.76rem !important;
            padding: 0.45rem 0.6rem !important;
          }
        }
        @media (max-width: 420px) {
          .portfolio-manager-root .portfolio-grid {
            gap: 0.6rem !important;
          }
          .portfolio-manager-root .portfolio-category-card {
            border-radius: 14px !important;
          }
          .portfolio-manager-root .portfolio-item-card {
            border-radius: 12px !important;
          }
          .portfolio-manager-root .portfolio-uploader-pane {
            padding: 0.8rem !important;
          }
        }
      `}</style>

      {/* دیالوگ موفقیت */}
      <SuccessModal
        open={successModal.open}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ open: false, title: '', message: '' })}
      />

      {/* دیالوگ خطا */}
      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, title: '', message: '' })}
      />

      {/* دیالوگ تایید حذف */}
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            message={confirm.message}
            onConfirm={confirm.onConfirm}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: T.inkLight }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', marginBottom: '12px' }}
          >
            <ImageIcon size={32} style={{ color: T.purpleMid }} />
          </motion.div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>در حال بارگذاری...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: T.surface, borderRadius: '20px',
              border: `1.5px solid ${T.border}`,
              boxShadow: T.shadow, overflow: 'hidden',
            }}
          >
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${T.purple}, ${T.purpleDark})` }} />
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: T.purpleLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Plus size={18} style={{ color: T.purple }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: T.ink }}>
                  دسته‌بندی جدید {categories.length >= MAX_CATEGORIES && <span style={{ color: T.red, fontSize: '0.8rem' }}>(تکمیل شده)</span>}
                </h3>
                <span style={{ fontSize: '0.8rem', color: T.inkLight, marginRight: 'auto' }}>
                  {categories.length}/{MAX_CATEGORIES}
                </span>
              </div>

              <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: T.inkMid, marginBottom: '5px' }}>
                    نام دسته‌بندی <span style={{ color: T.red }}>*</span>
                    <span style={{ color: T.inkLight, fontWeight: 400, marginRight: '8px' }}>
                      (حداکثر {MAX_CATEGORY_NAME_LENGTH} کاراکتر)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => {
                      const val = e.target.value.slice(0, MAX_CATEGORY_NAME_LENGTH);
                      setNewName(val);
                    }}
                    placeholder="مثال: اصلاح مو، رنگ مو، ..."
                    maxLength={MAX_CATEGORY_NAME_LENGTH}
                    disabled={categories.length >= MAX_CATEGORIES}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '9px 12px', borderRadius: T.radiusSm,
                      border: `1.5px solid ${T.border}`,
                      fontSize: '0.9rem', fontFamily: 'inherit', color: T.ink, outline: 'none',
                      opacity: categories.length >= MAX_CATEGORIES ? 0.6 : 1,
                    }}
                    onFocus={e => e.target.style.borderColor = T.purple}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                  <div style={{ fontSize: '0.75rem', color: T.inkLight, marginTop: '4px', textAlign: 'left' }}>
                    {newName.length}/{MAX_CATEGORY_NAME_LENGTH}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: T.inkMid, marginBottom: '5px' }}>
                    توضیح <span style={{ color: T.inkLight, fontWeight: 400 }}>(اختیاری، حداکثر {MAX_DESCRIPTION_LENGTH} کاراکتر)</span>
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={e => {
                      const val = e.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
                      setNewDesc(val);
                    }}
                    placeholder="توضیح کوتاه..."
                    rows={2}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    disabled={categories.length >= MAX_CATEGORIES}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '9px 12px', borderRadius: T.radiusSm,
                      border: `1.5px solid ${T.border}`,
                      fontSize: '0.9rem', fontFamily: 'inherit', color: T.ink,
                      resize: 'vertical', outline: 'none',
                      opacity: categories.length >= MAX_CATEGORIES ? 0.6 : 1,
                    }}
                    onFocus={e => e.target.style.borderColor = T.purple}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                  <div style={{ fontSize: '0.75rem', color: T.inkLight, marginTop: '4px', textAlign: 'left' }}>
                    {newDesc.length}/{MAX_DESCRIPTION_LENGTH}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={submitting || !newName.trim() || categories.length >= MAX_CATEGORIES}
                  style={{
                    padding: '10px', borderRadius: T.radiusSm, border: 'none',
                    background: (submitting || !newName.trim() || categories.length >= MAX_CATEGORIES)
                      ? T.borderLight
                      : `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`,
                    color: (submitting || !newName.trim() || categories.length >= MAX_CATEGORIES) ? T.inkLight : '#fff',
                    fontWeight: 700, fontSize: '0.9rem',
                    cursor: (submitting || !newName.trim() || categories.length >= MAX_CATEGORIES) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    boxShadow: (submitting || !newName.trim() || categories.length >= MAX_CATEGORIES) ? 'none' : '0 4px 14px rgba(124,92,252,0.3)',
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                >
                  <Plus size={16} />
                  {submitting ? 'در حال ایجاد...' : 'افزودن دسته‌بندی'}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {categories.length === 0 ? (
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
                <ImageIcon size={48} style={{ color: T.purpleMid, marginBottom: '1rem' }} />
              </motion.div>
              <h3 style={{ color: T.inkMid, fontWeight: 700, margin: '0 0 6px' }}>هیچ دسته‌بندی وجود ندارد</h3>
              <p style={{ color: T.inkLight, margin: 0, fontSize: '0.88rem' }}>
                ابتدا یک دسته‌بندی بسازید و سپس عکس اضافه کنید
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {categories.map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  index={i}
                  onDelete={handleDeleteCategory}
                  onUpload={handleUpload}
                  uploadingId={uploadingId}
                  onDeleteItem={handleDeleteItem}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}