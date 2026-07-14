import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LogOut, Home, Calendar, Settings,
  MessageCircle, ChevronDown, Scissors, Moon, Sun
} from 'lucide-react';

// ─── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  brand: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
  brandSolid: 'var(--primary)',
  accent: 'var(--primary-hover)',
  accentLow: 'rgba(59, 130, 246, 0.12)',
  accentMid: 'rgba(59, 130, 246, 0.2)',
  tg: 'var(--secondary)',
  tgLow: 'rgba(96, 165, 250, 0.12)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text-primary)',
  muted: 'var(--text-secondary)',
  danger: 'var(--danger)',
  dangerLow: 'rgba(239, 68, 68, 0.08)',
};

// ─── Helper: Role badge ─────────────────────────────────────────────────────
function roleMeta(role, language) {
  if (role === 'owner') return { label: language === 'en' ? 'Owner' : 'مالک سالن', color: '#f59e0b' };
  if (role === 'staff') return { label: language === 'en' ? 'Staff' : 'کارمند', color: 'var(--secondary)' };
  return { label: language === 'en' ? 'Customer' : 'مشتری', color: '#10b981' };
}

// ─── NavItem ────────────────────────────────────────────────────────────────
function NavItem({ to, icon, children, active }) {
  return (
    <Link to={to} style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '8px 16px',
      minWidth: '120px',
      borderRadius: '10px',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: active ? 700 : 500,
      color: active ? C.brandSolid : C.muted,
      background: active ? C.accentLow : 'transparent',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.accentLow; e.currentTarget.style.color = C.brandSolid; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; } }}
    >
      {active && (
        <Motion.span
          layoutId="nav-pill"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            background: C.accentLow,
            border: `1.5px solid ${C.accentMid}`,
            zIndex: -1,
          }}
        />
      )}
      {icon}
      {children}
    </Link>
  );
}

// ─── MobileNavItem ──────────────────────────────────────────────────────────
function MobileNavItem({ to, icon, children, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        textDecoration: 'none',
        fontSize: '1rem',
        fontWeight: active ? 700 : 500,
        color: active ? 'white' : C.text,
        background: active ? C.brand : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
      {children}
    </Link>
  );
}

function ThemeToggle({ theme, onClick, mobile = false }) {
  const isDark = theme === 'dark';
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('header.theme')}
      aria-pressed={isDark}
      className={`hdr-theme-toggle${mobile ? ' hdr-theme-toggle--mobile' : ''}`}
    >
      <span className="hdr-theme-toggle__track">
        <span className="hdr-theme-toggle__icon hdr-theme-toggle__icon--sun">
          <Sun size={14} />
        </span>
        <Motion.span
          layout
          className="hdr-theme-toggle__thumb"
          animate={{ x: isDark ? (mobile ? 56 : 54) : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        />
        <span className="hdr-theme-toggle__icon hdr-theme-toggle__icon--moon">
          <Moon size={14} />
        </span>
      </span>
      <span className="hdr-theme-toggle__label">{isDark ? t('header.themeLight') : t('header.themeDark')}</span>
    </button>
  );
}

function LanguageToggle({ mobile = false }) {
  const { language, setLanguage, t } = useLanguage();
  const isEnglish = language === 'en';

  return (
    <button
      type="button"
      onClick={() => setLanguage(isEnglish ? 'fa' : 'en')}
      aria-label={t('header.toggle')}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: mobile ? '12px 14px' : '8px 12px', minWidth: mobile ? '140px' : '110px',
        borderRadius: '999px', border: '1px solid var(--border)', background: 'var(--card-hover)',
        color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700, fontSize: mobile ? '0.95rem' : '0.9rem',
        transition: 'all 0.2s ease', outline: 'none', boxShadow: 'none',
      }}
    >
      <span>{isEnglish ? 'FA' : 'EN'}</span>
      <span>{isEnglish ? t('header.switchToPersian') : t('header.switchToEnglish')}</span>
    </button>
  );
}

// ─── Main Header ────────────────────────────────────────────────────────────
export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const is = (path) => location.pathname === path;
  const close = () => { setMenuOpen(false); setUserDropdown(false); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const closeOnRouteChange = () => {
      window.requestAnimationFrame(() => {
        setMenuOpen(false);
        setUserDropdown(false);
      });
    };

    closeOnRouteChange();
  }, [location.pathname]);

  // Close dropdown when clicking anywhere on the page
  useEffect(() => {
    if (!userDropdown) return;

    const handleClickOutside = (e) => {
      // Check if click is outside the dropdown area
      const isClickOnDropdown = e.target.closest('[data-user-dropdown]');
      if (!isClickOnDropdown) {
        setUserDropdown(false);
      }
    };

    // Add slight delay to avoid immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userDropdown]);

  const handleLogout = () => { logout(); close(); navigate('/login'); };

  const isOwnerOrStaff = user?.role === 'owner' || user?.role === 'staff';
  const rm = roleMeta(user?.role, useLanguage().language);

  return (
    <>
      <style>{`
        @media (max-width: 900px) { .hdr-desktop { display: none !important; } }
        @media (min-width: 901px) { .hdr-mobile-btn { display: none !important; } }
        .hdr-user-btn:hover .hdr-chevron { transform: rotate(180deg); }
        .hdr-chevron { transition: transform 0.25s; }
        .hdr-tg-btn:hover { background: ${C.tg} !important; color: white !important; }

        .hdr-theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0.45rem 0.8rem;
          min-width: 128px;
          height: 44px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          background: var(--card-hover);
          color: var(--text-primary);
          cursor: pointer;
          transition: background 0.25s ease, border-color 0.25s ease, transform 0.2s ease, color 0.25s ease;
          position: relative;
          line-height: 1;
        }

        .hdr-theme-toggle:hover {
          background: var(--surface);
        }

        .hdr-theme-toggle:focus-visible {
          outline: none;
          box-shadow: none;
        }

        .hdr-theme-toggle:focus {
          outline: none;
          box-shadow: none;
        }

        .hdr-theme-toggle__track {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          width: 96px;
          min-width: 96px;
          height: 44px;
          padding: 0 8px;
          border-radius: 9999px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .hdr-theme-toggle__icon {
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: inherit;
          transition: opacity 0.2s ease;
        }

        .hdr-theme-toggle__thumb {
          position: absolute;
          top: 4px;
          left: 2px;
          width: 38px;
          height: 38px;
          border-radius: 9999px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.24);
          pointer-events: none;
          z-index: 0;
        }

        .hdr-theme-toggle__label {
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .hdr-theme-toggle--mobile {
          width: 100%;
          justify-content: center;
          gap: 12px;
          padding: 12px 14px;
          margin-top: 10px;
          background: var(--card-hover);
          border: 1px solid var(--border);
          min-height: 52px;
        }

        .hdr-theme-toggle--mobile .hdr-theme-toggle__track {
          width: 104px;
          min-width: 104px;
          height: 48px;
          padding: 0 8px;
        }

        .hdr-theme-toggle--mobile .hdr-theme-toggle__thumb {
          width: 38px;
          height: 38px;
          top: 5px;
          left: 2px;
        }

        .hdr-theme-toggle--mobile .hdr-theme-toggle__label {
          font-size: 0.95rem;
        }
      `}</style>

      <Motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: C.surface,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
          boxShadow: scrolled ? '0 2px 24px rgba(124,58,237,0.06)' : 'none',
          transition: 'box-shadow 0.3s, border-color 0.3s',
        }}
      >
        {/* Top accent stripe */}
        <div style={{ height: '3px', background: C.brand }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 1.5rem)' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', minHeight: '72px', padding: '0.5rem 0',
          }}>

            {/* ── Logo ── */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <Motion.div
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: C.brand,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.28)',
                }}
              >
                <Scissors size={20} strokeWidth={2.2} />
              </Motion.div>
              <div>
                <div style={{
                  fontSize: '1.25rem', fontWeight: 800,
                  background: C.brand,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                }}>{t('header.brandTitle')}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.01em' }}>
                  {t('header.brandSubtitle')}
                </div>
              </div>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hdr-desktop" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <NavItem to="/" icon={<Home size={16} />} active={is('/')}>{t('header.home')}</NavItem>

              {isAuthenticated && !isOwnerOrStaff && (
                <NavItem to="/my-bookings" icon={<Calendar size={16} />} active={is('/my-bookings')}>
                  {t('header.myBookings')}
                </NavItem>
              )}
              {isAuthenticated && isOwnerOrStaff && (
                <NavItem to="/owner-bookings" icon={<Calendar size={16} />} active={is('/owner-bookings')}>
                  {t('header.ownerBookings')}
                </NavItem>
              )}
              {isAuthenticated && user?.role === 'owner' && (
                <NavItem to="/admin" icon={<Settings size={16} />} active={is('/admin')}>
                  {t('header.admin')}
                </NavItem>
              )}

              <LanguageToggle />
              <ThemeToggle theme={theme} onClick={toggleTheme} />
              <a
                href="https://t.me/amir_rezaiyan"
                target="_blank"
                rel="noopener noreferrer"
                className="hdr-tg-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '8px 16px', minWidth: '120px', borderRadius: '10px',
                  textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
                  color: C.tg, background: C.tgLow,
                  transition: 'all 0.2s ease', marginRight: '4px',
                }}
              >
                <MessageCircle size={16} />
                {t('header.support')}
              </a>
            </nav>

            {/* ── Auth Section Desktop ── */}
            <div className="hdr-desktop" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAuthenticated ? (
                <div style={{ position: 'relative' }} data-user-dropdown>
                  {/* User button */}
                  <button
                    className="hdr-user-btn"
                    onClick={() => setUserDropdown(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 14px 7px 10px',
                      borderRadius: '12px', border: `1.5px solid ${C.border}`,
                      background: 'var(--card)', cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: C.brand,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.9rem', fontWeight: 700,
                    }}>
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                        {user?.username}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: rm.color, fontWeight: 600 }}>
                        {rm.label}
                      </div>
                    </div>
                    <ChevronDown size={15} className="hdr-chevron" style={{ color: C.muted, marginRight: '2px' }} />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {userDropdown && (
                      <>
                        <div
                          style={{ 
                            position: 'fixed', 
                            inset: 0, 
                            zIndex: 10,
                            backgroundColor: 'transparent',
                            pointerEvents: 'auto'
                          }}
                          onClick={() => setUserDropdown(false)}
                        />
                        <Motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: 'absolute', top: 'calc(100% + 10px)', left: 0,
                            minWidth: '200px', borderRadius: '16px',
                            background: 'var(--card)', border: `1px solid ${C.border}`,
                            boxShadow: 'var(--shadow-sm)',
                            overflow: 'hidden', zIndex: 20,
                            pointerEvents: 'auto'
                          }}
                        >
                          {/* User info inside dropdown */}
                          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: '0.8rem', color: C.muted }}>{t('header.userAs')}</div>
                            <div style={{ fontWeight: 700, color: C.text, marginTop: '2px' }}>{user?.username}</div>
                          </div>
                          {/* Logout */}
                          <button
                            onClick={handleLogout}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '13px 16px', background: 'transparent', border: 'none',
                              cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
                              color: C.danger, textAlign: 'left', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.dangerLow}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <LogOut size={17} />
                            {t('header.logout')}
                          </button>
                        </Motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/login" style={{
                    padding: '8px 20px', minWidth: '120px', justifyContent: 'center', display: 'inline-flex', borderRadius: '10px', textDecoration: 'none',
                    fontSize: '0.9rem', fontWeight: 600, color: C.brandSolid,
                    border: `1.5px solid ${C.accentMid}`, background: C.accentLow,
                    transition: 'all 0.2s',
                  }}>
                    {t('header.login')}
                  </Link>
                  <Link to="/signup" style={{
                    padding: '8px 20px', minWidth: '120px', justifyContent: 'center', display: 'inline-flex', borderRadius: '10px', textDecoration: 'none',
                    fontSize: '0.9rem', fontWeight: 700, color: 'white',
                    background: C.brand, border: 'none',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                    transition: 'all 0.2s',
                  }}>
                    {t('header.signup')}
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile menu button ── */}
            <button
              className="hdr-mobile-btn"
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width: '42px', height: '42px', borderRadius: '12px',
                border: `1.5px solid ${C.border}`, background: 'var(--card-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-primary)',
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <Motion.span
                  key={menuOpen ? 'x' : 'm'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </Motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </Motion.header>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 999,
                background: 'rgba(30,27,75,0.3)',
                backdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer */}
            <Motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(320px, 100vw)', zIndex: 1000,
                background: 'var(--surface)',
                boxShadow: '-8px 0 48px rgba(0,0,0,0.35)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                willChange: 'transform, opacity',
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 20px 16px',
                borderBottom: `1px solid ${C.border}`,
              }}>
                <Link to="/" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', background: C.brand,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  }}>
                    <Scissors size={17} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', background: C.brand, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {t('header.brandTitle')}
                  </span>
                </Link>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    border: `1.5px solid ${C.border}`, background: C.accentLow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: C.brandSolid,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* User info in drawer */}
              {isAuthenticated && (
                <div style={{
                  margin: '16px 16px 8px',
                  padding: '14px', borderRadius: '14px',
                  background: C.accentLow, border: `1px solid ${C.accentMid}`,
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: C.brand, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1.1rem', fontWeight: 700,
                  }}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: '0.95rem' }}>{user?.username}</div>
                    <div style={{ fontSize: '0.75rem', color: rm.color, fontWeight: 600, marginTop: '2px' }}>{rm.label}</div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                <MobileNavItem to="/" icon={<Home size={18} />} active={is('/')} onClick={close}>
                  {t('header.home')}
                </MobileNavItem>

                {isAuthenticated && !isOwnerOrStaff && (
                  <>
                    <MobileNavItem to="/my-bookings" icon={<Calendar size={18} />} active={is('/my-bookings')} onClick={close}>
                      {t('header.myBookings')}
                    </MobileNavItem>
                    {/* Language toggle for customers */}
                    <button
                      onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px', borderRadius: '12px',
                        textDecoration: 'none', fontSize: '1rem', fontWeight: 600,
                        color: 'var(--text-primary)', background: 'var(--card-hover)', transition: 'all 0.2s',
                        border: '1px solid var(--border)', cursor: 'pointer', marginTop: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{language === 'en' ? 'FA' : 'EN'}</span>
                      <span>{language === 'en' ? t('header.switchToPersian') : t('header.switchToEnglish')}</span>
                    </button>
                  </>
                )}
                {isAuthenticated && isOwnerOrStaff && (
                  <>
                    <MobileNavItem to="/owner-bookings" icon={<Calendar size={18} />} active={is('/owner-bookings')} onClick={close}>
                      {t('header.ownerBookings')}
                    </MobileNavItem>
                    {user?.role === 'owner' && (
                      <>
                        <MobileNavItem to="/admin" icon={<Settings size={18} />} active={is('/admin')} onClick={close}>
                          {t('header.admin')}
                        </MobileNavItem>
                        {/* Language toggle for owners - below admin */}
                        <button
                          onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', borderRadius: '12px',
                            textDecoration: 'none', fontSize: '1rem', fontWeight: 600,
                            color: 'var(--text-primary)', background: 'var(--card-hover)', transition: 'all 0.2s',
                            border: '1px solid var(--border)', cursor: 'pointer', marginTop: '4px',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{language === 'en' ? 'FA' : 'EN'}</span>
                          <span>{language === 'en' ? t('header.switchToPersian') : t('header.switchToEnglish')}</span>
                        </button>
                      </>
                    )}
                    {user?.role !== 'owner' && (
                      /* Language toggle for staff */
                      <button
                        onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '14px 16px', borderRadius: '12px',
                          textDecoration: 'none', fontSize: '1rem', fontWeight: 600,
                          color: 'var(--text-primary)', background: 'var(--card-hover)', transition: 'all 0.2s',
                          border: '1px solid var(--border)', cursor: 'pointer', marginTop: '4px',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{language === 'en' ? 'FA' : 'EN'}</span>
                        <span>{language === 'en' ? t('header.switchToPersian') : t('header.switchToEnglish')}</span>
                      </button>
                    )}
                  </>
                )}

                {/* Divider */}
                <div style={{ height: '1px', background: C.border, margin: '10px 4px' }} />

                {/* Telegram */}
                <a
                  href="https://t.me/amir_rezaiyan"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', borderRadius: '12px',
                    textDecoration: 'none', fontSize: '1rem', fontWeight: 600,
                    color: C.tg, background: C.tgLow, transition: 'all 0.2s',
                  }}
                >
                  <MessageCircle size={18} />
                  {t('header.supportTelegram')}
                </a>
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px', gap: '8px', flexWrap: 'wrap' }}>
                  <ThemeToggle theme={theme} onClick={toggleTheme} mobile />
                </div>
              </div>

              {/* Bottom auth buttons */}
              <div style={{ padding: '16px', borderTop: `1px solid ${C.border}` }}>
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '8px',
                      padding: '14px', borderRadius: '12px',
                      background: C.dangerLow, border: `1.5px solid rgba(239,68,68,0.2)`,
                      color: C.danger, fontWeight: 700, fontSize: '1rem',
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={18} />
                    {t('header.logout')}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link
                      to="/login"
                      onClick={close}
                      style={{
                        flex: 1, textAlign: 'center', padding: '14px',
                        borderRadius: '12px', textDecoration: 'none',
                        fontWeight: 700, fontSize: '1rem',
                        color: C.brandSolid, background: C.accentLow,
                        border: `1.5px solid ${C.accentMid}`,
                      }}
                    >
                      {t('header.login')}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={close}
                      style={{
                        flex: 1, textAlign: 'center', padding: '14px',
                        borderRadius: '12px', textDecoration: 'none',
                        fontWeight: 700, fontSize: '1rem',
                        color: 'white', background: C.brand,
                        boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                      }}
                    >
                      {t('header.signup')}
                    </Link>
                  </div>
                )}
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}