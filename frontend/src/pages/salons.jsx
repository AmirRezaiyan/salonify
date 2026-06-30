import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Loading } from '../components/Loading';
import { toPersianNumber } from '../utils/formatCurrency';
import {
  Search, MapPin, Star, Scissors, X,
  ArrowRight, Shield, Sparkles, SortAsc, Check,
  TrendingUp, Clock, MessageSquare, AlignLeft, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ─── constants ─── */

const SORT_OPTIONS = [
  { value: 'smart',   label: 'پیشنهاد هوشمند',  icon: Sparkles,      desc: 'بر اساس موقعیت، امتیاز و نظرات' },
  { value: 'rating',  label: 'بالاترین امتیاز',  icon: Star,          desc: 'آرایشگاه‌های با بیشترین ستاره' },
  { value: 'newest',  label: 'جدیدترین',          icon: Clock,         desc: 'تازه‌ترین آرایشگاه‌های عضو' },
  { value: 'reviews', label: 'بیشترین نظرات',     icon: MessageSquare, desc: 'محبوب‌ترین در میان مشتریان' },
  { value: 'name',    label: 'نام (الفبا)',        icon: AlignLeft,     desc: 'مرتب‌سازی حروف الفبا' },
];

const PAGE_SIZE = 12;

/* ─── helpers ─── */

const normalizeGender = (value) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  const femaleHints = ['female','woman','women','lady','ladies','f','زن','زنانه','خانم','بانو'];
  const maleHints   = ['male','man','men','gent','gents','m','مرد','مردانه','آقا','آقای'];
  if (femaleHints.some(h => raw === h || raw.includes(h))) return 'female';
  if (maleHints.some(h => raw === h || raw.includes(h))) return 'male';
  return raw;
};

const genderLabel = (value) => {
  const n = normalizeGender(value);
  if (n === 'female') return 'زنانه';
  if (n === 'male')   return 'مردانه';
  return '';
};

/* ─── tokens ─── */

const T = {
  violet:    '#7c3aed',
  violetSoft:'#ede9fe',
  violetMid: '#8b5cf6',
  bg:        '#f5f3ff',
  white:     '#ffffff',
  slate9:    '#0f172a',
  slate7:    '#334155',
  slate5:    '#64748b',
  slate3:    '#cbd5e1',
  slate2:    '#e2e8f0',
  slate1:    '#f1f5f9',
  gold:      '#f59e0b',
  goldBg:    '#fffbeb',
  pink:      '#ec4899',
  pinkBg:    '#fdf2f8',
  red:       '#ef4444',
  redBg:     '#fef2f2',
  green:     '#10b981',
  overlay:   'rgba(15,23,42,0.55)',
};

const gradient = `linear-gradient(135deg, ${T.violet} 0%, #5b21b6 100%)`;
const gradientPink = `linear-gradient(135deg, ${T.pink} 0%, #be185d 100%)`;

/* ─────────────────────── Sort Dialog ─────────────────────── */

function SortDialog({ open, onClose, value, onChange }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="sort-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: T.overlay,
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div
          key="sort-panel"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '480px',
            background: T.white,
            borderRadius: '28px 28px 0 0',
            padding: '0 1.5rem 2.5rem',
            boxShadow: '0 -16px 64px rgba(124,58,237,0.18)',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: T.slate3 }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0 1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: T.slate9 }}>مرتب‌سازی</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: T.slate5 }}>نحوه نمایش آرایشگاه‌ها را انتخاب کنید</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: 'none', background: T.slate1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: T.slate7,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const active = value === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onChange(opt.value); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '16px', border: 'none',
                    background: active ? T.violetSoft : T.slate1,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                    background: active ? T.violet : T.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: active ? `0 4px 12px ${T.violet}44` : '0 1px 4px rgba(0,0,0,0.07)',
                  }}>
                    <Icon size={18} color={active ? '#fff' : T.slate5} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: active ? T.violet : T.slate9, fontSize: '0.93rem' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: T.slate5, marginTop: '1px' }}>
                      {opt.desc}
                    </div>
                  </div>
                  {active && (
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: T.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Check size={12} color="#fff" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────── SalonCard ─────────────────────── */

function SalonCard({ salon, navigate }) {
  const isMale = normalizeGender(salon.gender) === 'male';
  const cardGradient = isMale ? gradient : gradientPink;
  const accentColor  = isMale ? T.violet : T.pink;
  const rating = parseFloat(salon.average_rating) || 0;

  let ownerPos = { x: 50, y: 50 };
  try {
    const pos = salon?.settings?.owner_image_position;
    if (pos) {
      const parsed = typeof pos === 'string' ? JSON.parse(pos) : pos;
      if (parsed?.x !== undefined) ownerPos = parsed;
    }
  } catch {}

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.22 }}
      style={{
        background: T.white, borderRadius: '22px',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(124,58,237,0.07)',
        border: `1px solid ${T.slate2}`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Banner */}
      <div style={{
        height: '120px', background: cardGradient,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Geometric pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        }} />
        <div style={{
          position: 'absolute', top: '-30px', left: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />

        {/* Avatar */}
        {salon.owner_image ? (
          <div style={{
            width: '62px', height: '62px', borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.7)',
            overflow: 'hidden', position: 'relative', zIndex: 1,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            <img
              src={salon.owner_image} alt={salon.name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: `${ownerPos.x}% ${ownerPos.y}%`,
              }}
            />
          </div>
        ) : (
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 1,
          }}>
            <Scissors size={26} color="#fff" />
          </div>
        )}

        {/* Gender badge */}
        {salon.gender && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(255,255,255,0.95)',
            color: accentColor,
            padding: '4px 10px', borderRadius: '20px',
            fontSize: '0.73rem', fontWeight: 800, zIndex: 2,
          }}>
            {isMale ? '♂ مردانه' : '♀ زنانه'}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '1.1rem 1.15rem 1.2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ color: T.slate9, fontSize: '1rem', fontWeight: 800, margin: 0, lineHeight: 1.35 }}>
          {salon.name}
        </h3>

        {salon.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: T.slate5, fontSize: '0.82rem' }}>
            <MapPin size={12} style={{ color: accentColor, flexShrink: 0 }} />
            {salon.city}
          </div>
        )}

        {rating > 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: T.goldBg, padding: '5px 10px',
            borderRadius: '20px', width: 'fit-content',
          }}>
            <Star size={12} fill={T.gold} color={T.gold} />
            <span style={{ fontWeight: 800, color: '#b45309', fontSize: '0.85rem' }}>{salon.average_rating}</span>
            {salon.review_count > 0 && (
              <span style={{ color: '#92400e', fontSize: '0.76rem' }}>({toPersianNumber(salon.review_count)} نظر)</span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.78rem', color: T.slate5, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={11} color={T.slate3} />
            بدون امتیاز
          </div>
        )}

        <button
          onClick={() => {
            localStorage.setItem('selected_salon_id', salon.id);
            localStorage.setItem('selected_salon_name', salon.name);
            navigate('/services');
          }}
          style={{
            marginTop: 'auto',
            padding: '11px',
            borderRadius: '14px', border: 'none',
            background: cardGradient,
            color: '#fff', fontSize: '0.88rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: `0 4px 14px ${accentColor}35`,
            transition: 'transform 0.18s, box-shadow 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 22px ${accentColor}45`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 14px ${accentColor}35`; }}
        >
          رزرو نوبت
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Filter Chip ─────────────────────── */

function Chip({ active, icon: Icon, label, onClick, danger }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '9px 16px', borderRadius: '50px',
        border: `1.5px solid ${danger ? '#fca5a5' : active ? T.violet : T.slate2}`,
        background: danger ? T.redBg : active ? T.violetSoft : T.white,
        color: danger ? T.red : active ? T.violet : T.slate7,
        fontSize: '0.86rem', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        transition: 'all 0.18s',
      }}
    >
      {Icon && <Icon size={13} />}
      {label}
    </motion.button>
  );
}

/* ─────────────────────── Main ─────────────────────── */

export default function Salons() {
  const [salons, setSalons]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [sortBy, setSortBy]           = useState('smart');
  const [page, setPage]               = useState(1);
  const [sortOpen, setSortOpen]       = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const viewerGender      = useMemo(() => normalizeGender(user?.gender), [user?.gender]);
  const viewerGenderLabel = genderLabel(viewerGender);
  const viewerCity        = useMemo(() => String(user?.city || '').trim(), [user?.city]);

  useEffect(() => { loadSalons(); }, []);
  useEffect(() => { setPage(1); }, [searchQuery, selectedGender, sortBy]);
  useEffect(() => {
    if (user?.role === 'customer' && viewerGender) setSelectedGender(viewerGender);
  }, [user?.role, viewerGender]);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const params = viewerGender ? { gender: viewerGender } : undefined;
      const response = await api.getAllSalons(params);
      setSalons(response.data || []);
      setError('');
    } catch {
      setError('بارگذاری لیست سالن‌ها ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  const smartScore = useCallback((s) => {
    let score = 0;
    if (viewerGender && normalizeGender(s.gender) === viewerGender) score += 100;
    score += (parseFloat(s.average_rating) || 0) * 10;
    score += Math.min(s.review_count || 0, 9) * 0.5;
    return score;
  }, [viewerGender]);

  const filtered = useMemo(() => {
    let list = [...salons];
    const effectiveGender = user?.role === 'customer' ? viewerGender : selectedGender;
    if (effectiveGender) list = list.filter(s => normalizeGender(s.gender) === effectiveGender);
    if (viewerCity) list = list.filter(s => String(s.city || '').trim().toLowerCase() === viewerCity.toLowerCase());
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'rating':  list.sort((a,b) => (parseFloat(b.average_rating)||0)-(parseFloat(a.average_rating)||0)); break;
      case 'newest':  list.sort((a,b) => new Date(b.created_at||0)-new Date(a.created_at||0)); break;
      case 'reviews': list.sort((a,b) => (b.review_count||0)-(a.review_count||0)); break;
      case 'name':    list.sort((a,b) => (a.name||'').localeCompare(b.name||'','fa')); break;
      default:        list.sort((a,b) => smartScore(b)-smartScore(a));
    }
    return list;
  }, [salons, searchQuery, selectedGender, sortBy, viewerGender, viewerCity, user?.role, smartScore]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const hasActiveFilters = searchQuery || (user?.role !== 'customer' && selectedGender) || sortBy !== 'smart';
  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy);

  const clearFilters = () => { setSearchQuery(''); setSelectedGender(''); setSortBy('smart'); };

  const goPage = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loading) return <Loading />;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, direction: 'rtl' }}>

      {/* Dialogs */}
      <SortDialog
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        value={sortBy}
        onChange={setSortBy}
      />

      {/* ── Header ── */}
      <div style={{
        background: gradient,
        padding: 'clamp(3rem,8vw,5rem) 1.5rem clamp(4rem,10vw,6rem)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        {[
          { top: '-15%', right: '-5%', size: '380px', op: 0.12 },
          { bottom: '-25%', left: '-6%', size: '320px', op: 0.08 },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: b.top, bottom: b.bottom, left: b.left, right: b.right,
            width: b.size, height: b.size,
            background: `rgba(255,255,255,${b.op})`,
            borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
          }} />
        ))}

        <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: '50px', padding: '8px 18px',
              color: '#fff', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: '1.75rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.24)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            <ArrowRight size={15} />
            بازگشت
          </button>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              color: '#fff', fontSize: 'clamp(1.9rem,4.5vw,3rem)',
              fontWeight: 900, margin: '0 0 0.6rem',
              textShadow: '0 4px 24px rgba(0,0,0,0.2)',
              letterSpacing: '-0.02em',
            }}
          >
            آرایشگاه‌های سالنیفای
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1rem', margin: '0 0 1.75rem' }}
          >
            از میان <strong style={{ color: '#fff' }}>{toPersianNumber(salons.length)}</strong> آرایشگاه در شهر شما انتخاب کنید
          </motion.p>

          {/* Gender badge for customer */}
          {user?.role === 'customer' && viewerGenderLabel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '8px 18px', borderRadius: '50px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#fff', fontSize: '0.86rem', fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              <Shield size={13} />
              فقط آرایشگاه‌های {viewerGenderLabel} نمایش داده می‌شود
            </motion.div>
          )}

          {/* City badge for customer */}
          {user?.role === 'customer' && viewerCity && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '8px 18px', borderRadius: '50px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#fff', fontSize: '0.86rem', fontWeight: 700,
                marginBottom: '1.5rem',
              }}
            >
              <MapPin size={13} />
              فقط آرایشگاه‌های شهر شما نمایش داده می‌شود
            </motion.div>
          )}

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}
          >
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام آرایشگاه یا شهر..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '16px 52px 16px 52px',
                borderRadius: '50px', border: 'none',
                fontSize: '0.97rem', fontFamily: 'inherit',
                background: '#fff',
                boxShadow: '0 8px 36px rgba(0,0,0,0.2)',
                outline: 'none', direction: 'rtl',
                color: T.slate9,
              }}
            />
            <Search size={19} style={{
              position: 'absolute', top: '50%', right: '18px',
              transform: 'translateY(-50%)', color: T.slate5, pointerEvents: 'none',
            }} />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', top: '50%', left: '14px',
                  transform: 'translateY(-50%)',
                  background: T.slate1, border: 'none', borderRadius: '50%',
                  width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: T.slate5,
                }}
              >
                <X size={14} />
              </button>
            )}
          </motion.div>
        </div>

        {/* Wave */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 52" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '52px' }}>
            <path d="M0,30 C360,56 1080,4 1440,30 L1440,52 L0,52 Z" fill={T.bg} />
          </svg>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

        {/* ── Filter bar ── */}
        <div style={{
          display: 'flex', gap: '0.6rem', alignItems: 'center',
          flexWrap: 'wrap', marginBottom: '2rem',
        }}>
          {/* Gender filter */}
          {user?.role === 'customer' ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '50px',
              border: `1.5px solid #dbeafe`,
              background: '#eff6ff',
              color: '#2563eb', fontSize: '0.86rem', fontWeight: 700,
            }}>
              {viewerGender === 'female' ? '♀ زنانه' : '♂ مردانه'}
              <span style={{
                padding: '2px 8px', borderRadius: '999px',
                background: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 800,
              }}>
                مخصوص شما
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              {[{v:'',l:'همه'},{v:'male',l:'♂ مردانه'},{v:'female',l:'♀ زنانه'}].map(g => (
                <button
                  key={g.v}
                  onClick={() => setSelectedGender(g.v)}
                  style={{
                    padding: '9px 14px', borderRadius: '50px',
                    border: `1.5px solid ${selectedGender === g.v ? T.violet : T.slate2}`,
                    background: selectedGender === g.v ? T.violetSoft : T.white,
                    color: selectedGender === g.v ? T.violet : T.slate7,
                    fontSize: '0.86rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {g.l}
                </button>
              ))}
            </div>
          )}

          {/* Sort chip */}
          <Chip
            active={sortBy !== 'smart'}
            icon={SortAsc}
            label={currentSort?.label}
            onClick={() => setSortOpen(true)}
          />

          {/* Clear */}
          {hasActiveFilters && (
            <Chip danger icon={X} label="پاک کردن" onClick={clearFilters} />
          )}

          {/* Count */}
          <div style={{ marginRight: 'auto', color: T.slate5, fontSize: '0.86rem', fontWeight: 500 }}>
            <span style={{ color: T.violet, fontWeight: 800 }}>{toPersianNumber(filtered.length)}</span> آرایشگاه
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: T.redBg, border: `1.5px solid #fca5a5`,
            borderRadius: '14px', padding: '1rem 1.25rem',
            color: T.red, marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem',
          }}>
            <X size={16} />
            {error}
          </div>
        )}

        {/* Smart sort banner */}
        {sortBy === 'smart' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: T.violetSoft,
              border: `1px solid ${T.violetMid}33`,
              borderRadius: '14px', padding: '10px 16px',
              marginBottom: '1.5rem',
              fontSize: '0.84rem', color: T.violet, fontWeight: 600,
            }}
          >
            <Sparkles size={15} />
            نتایج بر اساس موقعیت، امتیاز و محبوبیت مرتب شده‌اند
          </motion.div>
        )}

        {/* Grid or Empty */}
        {paginated.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center', padding: '5rem 2rem',
              background: T.white, borderRadius: '28px',
              border: `2px dashed ${T.slate3}`,
            }}
          >
            <Search size={52} style={{ color: T.violetSoft, marginBottom: '1rem' }} />
            <h3 style={{ color: T.slate7, fontSize: '1.3rem', margin: '0 0 0.5rem', fontWeight: 700 }}>
              {salons.length === 0 ? 'هنوز آرایشگاهی ثبت نشده' : 'آرایشگاهی یافت نشد'}
            </h3>
            <p style={{ color: T.slate5, margin: '0 0 1.5rem', fontSize: '0.92rem' }}>
              {hasActiveFilters ? 'فیلترها را تغییر دهید یا پاک کنید' : 'به زودی آرایشگاه‌های جدید اضافه می‌شوند'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '12px 28px', borderRadius: '12px', border: 'none',
                  background: gradient,
                  color: '#fff', fontSize: '0.92rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                پاک کردن فیلترها
              </button>
            )}
          </motion.div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.4rem',
          }}>
            <AnimatePresence mode="popLayout">
              {paginated.map(salon => (
                <SalonCard key={salon.id} salon={salon} navigate={navigate} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '6px', marginTop: '3rem', flexWrap: 'wrap',
          }}>
            <button
              onClick={() => goPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                border: `1.5px solid ${T.slate2}`,
                background: page === 1 ? T.slate1 : T.white,
                color: page === 1 ? T.slate3 : T.slate7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: page === 1 ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <ChevronRight size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`d-${idx}`} style={{ color: T.slate5, padding: '0 2px', fontSize: '0.9rem' }}>…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goPage(item)}
                    style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      border: `1.5px solid ${item === page ? T.violet : T.slate2}`,
                      background: item === page ? T.violet : T.white,
                      color: item === page ? '#fff' : T.slate7,
                      fontSize: '0.88rem', fontWeight: item === page ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {item}
                  </button>
                )
              )
            }

            <button
              onClick={() => goPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                border: `1.5px solid ${T.slate2}`,
                background: page === totalPages ? T.slate1 : T.white,
                color: page === totalPages ? T.slate3 : T.slate7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: page === totalPages ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}