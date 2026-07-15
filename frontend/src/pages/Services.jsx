import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import Reviews from '../components/Reviews';
import PortfolioGallery from '../components/PortfolioGallery';
import {
  Scissors, Clock, Calendar, XCircle,
  AlertTriangle, ChevronRight, Sparkles,
  BadgeCheck, Ban, Star, MapPin
} from 'lucide-react';
import { formatToman, toPersianNumber } from '../utils/formatCurrency';

/* ─── tokens ──────────────────────────────────────────────────────────────── */
const getThemeTokens = (theme) => ({
  purple: theme === 'dark' ? '#8B5CF6' : '#7C5CFC',
  purpleDark: theme === 'dark' ? '#7C3AED' : '#5B3DD8',
  purpleDeep: theme === 'dark' ? '#4C1D95' : '#3D27A8',
  purpleLight: theme === 'dark' ? 'rgba(139,92,246,0.18)' : '#EDE9FF',
  purpleMid: theme === 'dark' ? 'rgba(192,132,252,0.45)' : '#C4B5FD',
  green: '#22C55E',
  greenBg: theme === 'dark' ? 'rgba(34,197,94,0.18)' : '#DCFCE7',
  greenText: theme === 'dark' ? '#86EFAC' : '#15803D',
  red: '#EF4444',
  redBg: theme === 'dark' ? 'rgba(239,68,68,0.18)' : '#FEE2E2',
  redText: theme === 'dark' ? '#FECACA' : '#991B1B',
  amber: '#F59E0B',
  ink: theme === 'dark' ? '#F8FAFC' : '#0F172A',
  inkMid: theme === 'dark' ? '#CBD5E1' : '#475569',
  inkLight: theme === 'dark' ? '#94A3B8' : '#94A3B8',
  surface: 'var(--card)',
  bg: 'var(--background)',
  border: 'var(--border)',
  radius: '18px',
  radiusSm: '12px',
  shadow: theme === 'dark' ? '0 2px 16px rgba(2,6,23,0.35)' : '0 2px 16px rgba(124,92,252,0.09)',
  shadowHover: theme === 'dark' ? '0 12px 40px rgba(2,6,23,0.46)' : '0 12px 40px rgba(124,92,252,0.18)',
});

/* ─── animation variants ──────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 28, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── SalonBanner ─────────────────────────────────────────────────────────── */
function SalonBanner({ salon, servicesCount, T, t, isEnglish }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.purple} 0%, ${T.purpleDeep} 100%)`,
      padding: '3rem 1.5rem 4rem',
      position: 'relative',
      overflow: 'hidden',
      direction: isEnglish ? 'ltr' : 'rtl',
      textAlign: isEnglish ? 'left' : 'right',
    }}>
      {/* animated background circles */}
      {[
        { w: 320, h: 320, top: '-80px', left: '-80px', delay: 0 },
        { w: 220, h: 220, bottom: '-60px', right: '-40px', delay: 0.3 },
        { w: 140, h: 140, top: '30%', left: '40%', delay: 0.6 },
      ].map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: c.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: c.w, height: c.h,
            top: c.top, bottom: c.bottom,
            left: c.left, right: c.right,
            borderRadius: '50%',
            background: 'var(--surface-glass)',
            filter: 'blur(40px)',
          }}
        />
      ))}

      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        position: 'relative', zIndex: 1,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          {/* scissors icon */}
          <motion.div
            initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '60px', height: '60px', borderRadius: T.radius,
              background: 'var(--surface-glass-strong)',
              backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem',
              border: '1px solid var(--surface-glass)',
            }}
          >
            <Scissors size={30} color="#fff" />
          </motion.div>

          <motion.h1
            {...fadeUp(0.15)}
            style={{
              color: '#fff',
              fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
              fontWeight: 800,
              margin: '0 0 0.4rem',
              letterSpacing: '-0.8px',
              lineHeight: 1.1,
            }}
          >
            {salon?.name || t('services.heroTitle')}
          </motion.h1>

          <motion.p
            {...fadeUp(0.25)}
            style={{ color: 'var(--text-light)', margin: 0, fontSize: '1rem' }}
          >
            {t('services.heroSubtitle')}
          </motion.p>
        </div>

        {/* badges top-right */}
        <motion.div
          {...fadeUp(0.35)}
          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '4px' }}
        >
          {salon?.gender && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '6px 14px', borderRadius: '999px',
              background: 'var(--surface-glass-strong)',
              border: '1px solid var(--surface-glass)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              backdropFilter: 'blur(6px)',
            }}>
              <Scissors size={12} />
              {salon.gender === 'male' ? t('services.genderMale') : t('services.genderFemale')}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '6px 14px', borderRadius: '999px',
            background: 'var(--surface-glass-strong)',
            border: '1px solid var(--surface-glass)',
            color: '#fff', fontSize: '0.82rem', fontWeight: 600,
            backdropFilter: 'blur(6px)',
          }}>
            <BadgeCheck size={12} />
            {toPersianNumber(servicesCount)} {servicesCount === 1 ? t('services.activeServices') : t('services.activeServicesPlural')}
          </span>
        </motion.div>
      </div>

      {/* wave bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M0 48L60 42.7C120 37.3 240 26.7 360 24C480 21.3 600 26.7 720 29.3C840 32 960 32 1080 29.3C1200 26.7 1320 21.3 1380 18.7L1440 16V48H1380C1320 48 1200 48 1080 48C960 48 840 48 720 48C600 48 480 48 360 48C240 48 120 48 60 48H0Z" fill={T.bg} />
        </svg>
      </div>
    </div>
  );
}

/* ─── DisabledBanner ──────────────────────────────────────────────────────── */
function DisabledBanner({ salon, T, t, isEnglish }) {
  if (!salon?.is_currently_disabled) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.4 }}
      style={{
        background: T.redBg, border: `1.5px solid #FECACA`,
        borderRadius: T.radius, padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        color: T.redText, marginBottom: '1.5rem', direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right', overflow: 'hidden',
      }}
    >
      <Ban size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.95rem' }}>
          {t('services.disabledTitle')}
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>
          {salon?.disabled_until
            ? isEnglish
              ? `Unavailable until ${new Date(salon.disabled_until).toLocaleDateString(isEnglish ? 'en-US' : 'fa-IR')}${salon?.disable_reason ? ` — ${salon.disable_reason}` : ''}.`
              : `تا ${new Date(salon.disabled_until).toLocaleDateString('fa-IR')} غیرفعال است${salon?.disable_reason ? ` — ${salon.disable_reason}` : ''}.`
            : isEnglish
              ? 'Unavailable until further notice.'
              : 'تا اطلاع ثانوی غیرفعال است.'}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── PriceNote ───────────────────────────────────────────────────────────── */
function PriceNote({ T, t, isEnglish }) {
  return (
    <motion.div
      {...fadeUp(0.1)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.75rem 1rem', borderRadius: T.radiusSm,
        background: T.purpleLight,
        border: `1px solid ${T.purpleMid}`,
        color: T.purpleDark,
        fontSize: '0.85rem', marginBottom: '2rem', direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right',
      }}
    >
      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
      {t('services.priceNote')}
    </motion.div>
  );
}

/* ─── AboutOwner ──────────────────────────────────────────────────────────── */
function AboutOwner({ salon, T, t, isEnglish }) {
  if (!salon?.owner_image && !salon?.owner_description) return null;

  let imgPosition = { x: 50, y: 50 };
  try {
    const pos = salon?.settings?.owner_image_position;
    if (pos) {
      const parsed = typeof pos === 'string' ? JSON.parse(pos) : pos;
      if (parsed?.x !== undefined) imgPosition = parsed;
    }
  } catch {}

  return (
    <motion.div
      {...fadeUp(0.15)}
      style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        marginBottom: '2rem',
        direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right',
        background: `linear-gradient(135deg, ${T.purple} 0%, ${T.purpleDeep} 100%)`,
        boxShadow: '0 8px 32px rgba(124,92,252,0.22)',
      }}
    >
      {/* decorative blobs */}
      <div style={{
        position: 'absolute', top: '-40px', left: '-40px',
        width: '180px', height: '180px', borderRadius: '50%',
        background: 'var(--surface-glass)', filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30px', right: '10%',
        width: '140px', height: '140px', borderRadius: '50%',
        background: 'var(--surface-glass)', filter: 'blur(24px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        display: 'flex', gap: 'clamp(1.25rem, 3vw, 2rem)',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        {salon?.owner_image && (
          <div style={{ flexShrink: 0, position: 'relative' }}>
            {/* outer glow ring */}
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'var(--surface-glass-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.18)',
            }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                overflow: 'hidden', border: '3px solid rgba(255,255,255,0.6)',
              }}>
                <img
                  src={salon.owner_image}
                  alt="Owner"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${imgPosition.x}% ${imgPosition.y}%`,
                  }}
                />
              </div>
            </div>
            {/* verified badge */}
            <div style={{
              position: 'absolute', bottom: '2px', left: '2px',
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#22C55E',
              border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              <BadgeCheck size={13} color="white" />
            </div>
          </div>
        )}

        {/* Text */}
        <div style={{ flex: 1, minWidth: '180px' }}>
          {/* label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '999px',
            background: 'var(--surface-glass-strong)',
            border: '1px solid var(--surface-glass)',
            marginBottom: '0.6rem',
          }}>
            <Scissors size={11} color="rgba(255,255,255,0.85)" />
            <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 600 }}>
              {t('services.aboutOwner')}
            </span>
          </div>

          <h3 style={{
            margin: '0 0 0.5rem', color: '#fff',
            fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 800,
            letterSpacing: '-0.3px',
          }}>
            {salon.name}
          </h3>

          {salon?.owner_description && (
            <p style={{
              margin: 0, color: 'rgba(255,255,255,0.82)',
              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
              lineHeight: 1.75,
            }}>
              {salon.owner_description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── SalonAddressCard ────────────────────────────────────────────────────── */
function SalonAddressCard({ salon, T, t, isEnglish }) {
  const address = salon?.address?.trim();
  if (!address) return null;

  return (
    <motion.div
      {...fadeUp(0.2)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        background: T.surface,
        borderRadius: T.radius,
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: T.radiusSm,
        background: T.purpleLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <MapPin size={20} style={{ color: T.purple }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          margin: '0 0 0.35rem',
          color: T.ink, fontSize: '0.95rem', fontWeight: 800,
          letterSpacing: '-0.2px',
        }}>
          {isEnglish ? 'Salon address' : 'آدرس سالن'}
        </h3>
        <p style={{
          margin: 0, color: T.inkMid,
          fontSize: '0.92rem', lineHeight: 1.8,
          wordBreak: 'break-word',
        }}>
          {address}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── StatCell ────────────────────────────────────────────────────────────── */
function StatCell({ icon, label, value, highlight, T }) {
  return (
    <div style={{
      background: highlight ? T.purpleLight : 'var(--background-secondary)',
      borderRadius: T.radiusSm,
      padding: '0.65rem 0.85rem',
      display: 'flex', flexDirection: 'column', gap: '3px',
      border: highlight ? `1px solid ${T.purpleMid}` : '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: highlight ? T.purple : T.inkLight }}>
        {icon}
        <span style={{ fontSize: '0.72rem' }}>{label}</span>
      </div>
      <span style={{ color: highlight ? T.purpleDark : T.ink, fontWeight: 700, fontSize: '0.95rem' }}>
        {value}
      </span>
    </div>
  );
}

/* ─── BookButton ──────────────────────────────────────────────────────────── */
function BookButton({ canBook, salonDisabled, onClick, T, isEnglish }) {
  if (salonDisabled) return (
    <div style={{
      width: '100%', padding: '10px', borderRadius: T.radiusSm,
      background: 'var(--card-hover)', color: T.inkLight,
      fontSize: '0.88rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      cursor: 'not-allowed',
    }}>
      <Ban size={15} /> {isEnglish ? 'Salon unavailable' : 'سالن غیرفعال'}
    </div>
  );

  if (!canBook) return (
    <div style={{
      width: '100%', padding: '10px', borderRadius: T.radiusSm,
      background: T.redBg, color: T.redText,
      fontSize: '0.88rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    }}>
      <XCircle size={15} /> {isEnglish ? 'Service unavailable' : 'خدمت غیرفعال است'}
    </div>
  );

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        width: '100%', padding: '11px', borderRadius: T.radiusSm,
        background: `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`,
        color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(124,92,252,0.35)',
        letterSpacing: '0.2px',
      }}
    >
      <Calendar size={15} /> {isEnglish ? 'Book appointment' : 'رزرو نوبت'}
    </motion.button>
  );
}

/* ─── ServiceCard ─────────────────────────────────────────────────────────── */
function ServiceCard({ service, salonDisabled, onBook, index, T, t, isEnglish }) {
  const [hovered, setHovered] = useState(false);
  const canBook = service.is_active && service.price > 0 && !salonDisabled && !!onBook;

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1.5px solid ${hovered ? T.purpleMid : T.border}`,
        boxShadow: hovered ? T.shadowHover : T.shadow,
        transition: 'border-color 0.2s, box-shadow 0.25s',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right',
        cursor: 'default',
      }}
    >
      {/* colored top bar */}
      <motion.div
        initial={{ scaleX: 0, originX: 1 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        style={{
          height: '4px',
          background: service.is_active
            ? `linear-gradient(90deg, ${T.green}, #16A34A)`
            : `linear-gradient(90deg, ${T.red}, #DC2626)`,
        }}
      />

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3 style={{ color: T.ink, fontSize: '1.05rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            {service.name}
          </h3>
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.06 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 10px', borderRadius: '999px',
              background: service.is_active ? T.greenBg : T.redBg,
              color: service.is_active ? T.greenText : T.redText,
              fontSize: '0.78rem', fontWeight: 600, flexShrink: 0,
            }}
          >
            {service.is_active ? <BadgeCheck size={11} /> : <XCircle size={11} />}
            {service.is_active ? (isEnglish ? 'Active' : 'فعال') : (isEnglish ? 'Inactive' : 'غیرفعال')}
          </motion.span>
        </div>

        {/* stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <StatCell icon={<Clock size={13} />} label={isEnglish ? 'Duration' : 'مدت زمان'} value={isEnglish ? `${service.duration_minutes} min` : `${toPersianNumber(service.duration_minutes)} دقیقه`} T={T} />
          <StatCell icon={<Sparkles size={13} />} label={isEnglish ? 'Base price' : 'قیمت پایه'} value={formatToman(service.price)} highlight T={T} />
        </div>

        {/* book button */}
        <div style={{ marginTop: 'auto' }}>
          <BookButton
            canBook={canBook}
            salonDisabled={salonDisabled}
            onClick={onBook ? () => onBook(service) : undefined}
            T={T}
            isEnglish={isEnglish}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── SectionTitle ────────────────────────────────────────────────────────── */
function SectionTitle({ icon, children, T, t, isEnglish }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        marginBottom: '1.4rem', direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right',
      }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: T.purpleLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <h2 style={{
        color: T.ink, fontSize: '1.2rem', fontWeight: 800,
        margin: 0, letterSpacing: '-0.3px',
      }}>
        {children}
      </h2>
    </motion.div>
  );
}

/* ─── EmptyState ──────────────────────────────────────────────────────────── */
function EmptyState({ isStaff, T, t, isEnglish }) {
  if (isStaff) {
    // For staff/owners - show a simple message
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: '4rem 2rem',
          background: T.surface, borderRadius: '24px',
          border: `2px dashed ${T.border}`, direction: isEnglish ? 'ltr' : 'rtl',
          textAlign: isEnglish ? 'left' : 'right',
        }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 0] }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <Scissors size={52} style={{ color: T.purpleMid, marginBottom: '1rem' }} />
        </motion.div>
        <h3 style={{ color: T.inkMid, fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
          {isEnglish ? 'No service has been added yet' : 'هنوز خدمتی ثبت نشده'}
        </h3>
        <p style={{ color: T.inkLight, margin: 0, fontSize: '0.9rem' }}>
          {isEnglish ? 'This salon has not added any services yet.' : 'این سالن هنوز خدمتی اضافه نکرده است.'}
        </p>
      </motion.div>
    );
  }

  // For customers - show a dialog message
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        padding: '4rem 2rem',
        background: T.redBg, borderRadius: '24px',
        border: `2px solid ${T.red}`, direction: isEnglish ? 'ltr' : 'rtl',
        textAlign: isEnglish ? 'left' : 'right',
      }}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -5, 0] }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <AlertTriangle size={52} style={{ color: T.red, marginBottom: '1rem' }} />
      </motion.div>
      <h3 style={{ color: T.redText, fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
        {isEnglish ? 'No services available' : 'سرویسی موجود نیست'}
      </h3>
      <p style={{ color: T.redText, margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
        {isEnglish ? 'The salon manager has not added any services for booking yet. Please check again later.' : 'مدیر سالن هنوز سرویسی برای رزرو ثبت نکرده است. لطفاً بعداً دوباره بررسی کنید.'}
      </p>
    </motion.div>
  );
}

/* ─── BackButton ──────────────────────────────────────────────────────────── */
function BackButton({ onClick, T, isEnglish }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        flexDirection: isEnglish ? 'row' : 'row',
        background: T.purpleLight,
        border: `1px solid ${T.purpleMid}`,
        borderRadius: '999px',
        color: T.purpleDark,
        fontSize: '0.85rem', fontWeight: 700,
        cursor: 'pointer', padding: '7px 16px',
        transition: 'background 0.15s',
      }}
    >
      <ChevronRight size={15} />
      {isEnglish ? 'Back' : 'بازگشت'}
    </motion.button>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function Services() {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const T = getThemeTokens(theme);
  const isEnglish = language === 'en';
  const pageDirection = isEnglish ? 'ltr' : 'rtl';
  const pageTextAlign = isEnglish ? 'left' : 'right';

  const isStaff = user?.role === 'owner' || user?.role === 'staff';

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const salonId = user?.salon?.id || localStorage.getItem('selected_salon_id');
      const salonName = user?.salon?.name || localStorage.getItem('selected_salon_name');
      if (!salonId) { navigate('/'); return; }
      try {
        const r = await api.getTenantById(salonId);
        setSalon(r.data);
      } catch {
        setSalon({ id: salonId, name: salonName });
      }
      const r = await api.getServices(salonId);
      setServices((r.data || []).filter((s) => s.is_active && Number(s.price) > 0));
      setError('');
    } catch (err) {
      console.error(err);
      setError('بارگذاری خدمات ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (service) => {
    localStorage.setItem('selected_service_id', service.id);
    localStorage.setItem('selected_service_name', service.name);
    navigate('/booking');
  };

  if (loading) return <Loading />;

  const activeCount = services.filter(s => s.is_active).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{ minHeight: '100vh', background: T.bg, direction: pageDirection, textAlign: pageTextAlign }}
    >
      {/* ── Banner ── */}
      <SalonBanner salon={salon} servicesCount={activeCount} T={T} t={t} isEnglish={isEnglish} />

      {/* ── Toolbar ── */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '1.5rem 1.5rem 0',
        display: 'flex', justifyContent: isEnglish ? 'flex-start' : 'flex-end',
        direction: pageDirection,
      }}>
        <BackButton onClick={() => navigate('/')} T={T} isEnglish={isEnglish} />
      </div>

      {/* ── Content ── */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '1.75rem 1.5rem 5rem',
        direction: pageDirection,
        textAlign: pageTextAlign,
      }}>
        {/* error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert type="error" message={error} onClose={() => setError('')}
                style={{ marginBottom: '1.5rem' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <DisabledBanner salon={salon} T={T} t={t} isEnglish={isEnglish} />
        <PriceNote T={T} t={t} isEnglish={isEnglish} />

        <AboutOwner salon={salon} T={T} t={t} isEnglish={isEnglish} />
        <SalonAddressCard salon={salon} T={T} t={t} isEnglish={isEnglish} />

        {/* ── Services ── */}
        <section style={{ marginBottom: '3.5rem' }}>
          <SectionTitle icon={<Scissors size={18} style={{ color: T.purple }} />} T={T} t={t} isEnglish={isEnglish}>
            {t('services.serviceList')}
          </SectionTitle>

          {services.length === 0 ? (
            <EmptyState isStaff={isStaff} T={T} t={t} isEnglish={isEnglish} />
          ) : (
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.1rem',
              }}
            >
              {services.map((service, i) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={i}
                  salonDisabled={!!salon?.is_currently_disabled}
                  onBook={isStaff ? null : handleBook}
                  T={T}
                  t={t}
                  isEnglish={isEnglish}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Reviews ── */}
        {salon?.id && (
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionTitle icon={<Star size={18} style={{ color: T.purple }} />} T={T} t={t} isEnglish={isEnglish}>
              {t('services.reviews')}
            </SectionTitle>

            <div style={{
              background: T.surface,
              borderRadius: '22px',
              border: `1.5px solid ${T.border}`,
              padding: '1.75rem',
              boxShadow: T.shadow,
            }}>
              <Reviews salonId={salon.id} />
            </div>
          </motion.section>
        )}

        {/* ── Portfolio ── */}
        {salon?.id && (
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: '3.5rem' }}
          >
            <PortfolioGallery salonId={salon.id} />
          </motion.section>
        )}
      </div>
    </motion.div>
  );
}