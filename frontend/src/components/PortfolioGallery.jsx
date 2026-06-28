import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Images, ZoomIn } from 'lucide-react';
import { api } from '../api/client';
import { toPersianNumber } from '../utils/formatCurrency';

const T = {
  purple: '#7C5CFC',
  purpleDark: '#5B3DD8',
  purpleLight: '#EDE9FF',
  purpleMid: '#C4B5FD',
  ink: '#0F172A',
  inkMid: '#475569',
  inkLight: '#94A3B8',
  surface: '#FFFFFF',
  bg: '#F5F3FF',
  border: '#E9E4FF',
  radius: '18px',
  radiusSm: '12px',
  shadow: '0 2px 16px rgba(124,92,252,0.09)',
  shadowHover: '0 12px 40px rgba(124,92,252,0.18)',
};

/* ─── Lightbox ────────────────────────────────────────────────────────────── */
function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const item = items[index];

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onPrev(); // RTL: right = prev
      if (e.key === 'ArrowLeft') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  // lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,6,30,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        direction: 'rtl',
      }}
    >
      {/* close */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: '16px', right: '16px',
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', zIndex: 10,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      >
        <X size={18} />
      </button>

      {/* counter */}
      <div style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(6px)',
        borderRadius: '999px',
        padding: '4px 14px',
        color: 'rgba(255,255,255,0.85)',
        fontSize: '0.8rem', fontWeight: 600,
        zIndex: 10,
      }}>
        {toPersianNumber(index + 1)} / {toPersianNumber(items.length)}
      </div>

      {/* image + nav */}
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '860px', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
        }}
      >
        {/* image wrapper */}
        <div style={{ position: 'relative' }}>
          <img
            src={item.image}
            alt={item.title}
            style={{
              width: '100%',
              maxHeight: '65vh',
              objectFit: 'contain',
              borderRadius: T.radius,
              display: 'block',
            }}
          />

          {/* prev / next — RTL aware */}
          {items.length > 1 && (
            <>
              <NavArrow side="right" onClick={(e) => { e.stopPropagation(); onPrev(); }}>
                <ChevronRight size={22} />
              </NavArrow>
              <NavArrow side="left" onClick={(e) => { e.stopPropagation(); onNext(); }}>
                <ChevronLeft size={22} />
              </NavArrow>
            </>
          )}
        </div>

        {/* info card */}
        {(item.title || item.description) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(8px)',
              borderRadius: T.radiusSm,
              padding: '0.85rem 1.1rem',
              color: '#fff',
            }}
          >
            {item.title && (
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.95rem' }}>
                {item.title}
              </p>
            )}
            {item.description && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                {item.description}
              </p>
            )}
          </motion.div>
        )}

        {/* dot strip */}
        {items.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); /* caller sets index */ }}
                style={{
                  width: i === index ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: i === index ? T.purple : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function NavArrow({ side, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        [side]: '-16px',
        top: '50%', transform: 'translateY(-50%)',
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.22)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#fff',
        transition: 'background 0.15s, transform 0.15s',
        zIndex: 2,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.28)';
        e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
      }}
    >
      {children}
    </button>
  );
}

/* ─── ImageTile ───────────────────────────────────────────────────────────── */
function ImageTile({ item, index, onClick }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      style={{
        position: 'relative',
        paddingTop: '100%', // square
        borderRadius: T.radiusSm,
        overflow: 'hidden',
        cursor: 'pointer',
        background: T.bg,
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadow,
      }}
    >
      {/* skeleton shimmer */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, ${T.bg} 25%, ${T.purpleLight} 50%, ${T.bg} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      )}

      <img
        src={item.image}
        alt={item.title}
        onLoad={() => setLoaded(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'transform 0.35s ease, opacity 0.3s',
        }}
      />

      {/* hover overlay */}
      <div
        className="tile-overlay"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(60,30,180,0.72) 0%, rgba(0,0,0,0) 55%)',
          opacity: 0,
          transition: 'opacity 0.25s',
          display: 'flex', alignItems: 'flex-end',
          padding: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff' }}>
          <ZoomIn size={14} />
          {item.title && (
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '120px',
            }}>
              {item.title}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { to { background-position: -200% 0 } }
        .tile-overlay:hover, [data-tile]:hover .tile-overlay { opacity: 1 }
        [data-tile]:hover img { transform: scale(1.07) }
      `}</style>
    </motion.div>
  );
}

/* ─── PortfolioGallery ────────────────────────────────────────────────────── */
const PortfolioGallery = ({ salonId }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;
    setLoading(true);
    api.getPortfolioCategories(salonId)
      .then(res => {
        setCategories(res.data);
        if (res.data.length > 0) setSelectedCategory(res.data[0].id);
      })
      .catch(err => console.error('portfolio error:', err))
      .finally(() => setLoading(false));
  }, [salonId]);

  const selectedData = categories.find(c => c.id === selectedCategory);
  const items = selectedData?.items || [];

  const handlePrev = useCallback(() =>
    setLightboxIndex(i => (i === 0 ? items.length - 1 : i - 1)), [items.length]);
  const handleNext = useCallback(() =>
    setLightboxIndex(i => (i === items.length - 1 ? 0 : i + 1)), [items.length]);

  if (loading) return (
    <div style={{
      background: T.surface,
      borderRadius: '22px',
      border: `1.5px solid ${T.border}`,
      padding: '3rem',
      display: 'flex', justifyContent: 'center',
      boxShadow: T.shadow,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <Images size={32} style={{ color: T.purpleMid }} />
      </motion.div>
    </div>
  );

  if (categories.length === 0) return null;

  return (
    <>
      <div style={{
        background: T.surface,
        borderRadius: '22px',
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadow,
        overflow: 'hidden',
        direction: 'rtl',
      }}>
        {/* header bar */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${T.purple}, ${T.purpleDark})` }} />

        <div style={{ padding: '1.5rem 1.75rem' }}>
          {/* title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: T.purpleLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Images size={18} style={{ color: T.purple }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: T.ink, letterSpacing: '-0.3px' }}>
              نمونه کارها
            </h3>
          </div>

          {/* category tabs */}
          <div style={{
            display: 'flex', gap: '8px',
            overflowX: 'auto', paddingBottom: '4px',
            marginBottom: '1.5rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            <style>{`::-webkit-scrollbar { display: none }`}</style>
            {categories.map(cat => {
              const active = cat.id === selectedCategory;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '999px',
                    border: active ? 'none' : `1.5px solid ${T.border}`,
                    background: active
                      ? `linear-gradient(135deg, ${T.purple}, ${T.purpleDark})`
                      : T.surface,
                    color: active ? '#fff' : T.inkMid,
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: active ? '0 4px 14px rgba(124,92,252,0.32)' : 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    letterSpacing: '0.1px',
                  }}
                >
                  {cat.name}
                  {cat.items?.length > 0 && (
                    <span style={{
                      marginRight: '6px',
                      fontSize: '0.72rem',
                      opacity: active ? 0.8 : 0.6,
                      background: active ? 'rgba(255,255,255,0.2)' : T.purpleLight,
                      color: active ? '#fff' : T.purple,
                      borderRadius: '999px',
                      padding: '1px 7px',
                      fontWeight: 600,
                    }}>
                      {toPersianNumber(cat.items.length)}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* grid */}
          <AnimatePresence mode="wait">
            {items.length > 0 ? (
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))',
                  gap: '0.65rem',
                }}
              >
                {items.map((item, i) => (
                  <div key={item.id} data-tile>
                    <ImageTile
                      item={item}
                      index={i}
                      onClick={() => setLightboxIndex(i)}
                    />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center', padding: '3rem 1rem',
                  color: T.inkLight, fontSize: '0.9rem',
                  border: `2px dashed ${T.border}`,
                  borderRadius: T.radiusSm,
                }}
              >
                هیچ نمونه‌کاری برای این دسته‌بندی ثبت نشده
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* lightbox portal */}
      <AnimatePresence>
        {lightboxIndex !== null && items.length > 0 && (
          <Lightbox
            items={items}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PortfolioGallery;