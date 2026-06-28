import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LogOut, Home, Calendar, Settings,
  MessageCircle, ChevronDown, Scissors
} from 'lucide-react';

// ─── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  brand:    'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
  brandSolid: '#7C3AED',
  accent:   '#7C3AED',
  accentLow: 'rgba(124,58,237,0.08)',
  accentMid: 'rgba(124,58,237,0.15)',
  tg:       '#0088cc',
  tgLow:    'rgba(0,136,204,0.1)',
  surface:  'rgba(255,255,255,0.92)',
  border:   'rgba(124,58,237,0.1)',
  text:     '#1e1b4b',
  muted:    '#64748b',
  danger:   '#ef4444',
  dangerLow:'rgba(239,68,68,0.08)',
};

// ─── Helper: Role badge ─────────────────────────────────────────────────────
function roleMeta(role) {
  if (role === 'owner') return { label: 'مالک', color: '#f59e0b' };
  if (role === 'staff') return { label: 'کارمند', color: '#3b82f6' };
  return { label: 'مشتری', color: '#10b981' };
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
        <motion.span
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

// ─── Main Header ────────────────────────────────────────────────────────────
export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
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

  useEffect(() => { close(); }, [location.pathname]);

  const handleLogout = () => { logout(); close(); navigate('/login'); };

  const isOwnerOrStaff = user?.role === 'owner' || user?.role === 'staff';
  const rm = roleMeta(user?.role);

  return (
    <>
      <style>{`
        @media (max-width: 900px) { .hdr-desktop { display: none !important; } }
        @media (min-width: 901px) { .hdr-mobile-btn { display: none !important; } }
        .hdr-user-btn:hover .hdr-chevron { transform: rotate(180deg); }
        .hdr-chevron { transition: transform 0.25s; }
        .hdr-tg-btn:hover { background: ${C.tg} !important; color: white !important; }
      `}</style>

      <motion.header
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

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', height: '68px',
          }}>

            {/* ── Logo ── */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <motion.div
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
              </motion.div>
              <div>
                <div style={{
                  fontSize: '1.25rem', fontWeight: 800,
                  background: C.brand,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                }}>سالنیفای</div>
                <div style={{ fontSize: '0.68rem', color: C.muted, fontWeight: 500, letterSpacing: '0.01em' }}>
                  نوبت‌دهی آنلاین
                </div>
              </div>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hdr-desktop" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <NavItem to="/" icon={<Home size={16} />} active={is('/')}>صفحه اصلی</NavItem>

              {isAuthenticated && !isOwnerOrStaff && (
                <NavItem to="/my-bookings" icon={<Calendar size={16} />} active={is('/my-bookings')}>
                  نوبت‌های من
                </NavItem>
              )}
              {isAuthenticated && isOwnerOrStaff && (
                <NavItem to="/owner-bookings" icon={<Calendar size={16} />} active={is('/owner-bookings')}>
                  رزروهای سالن
                </NavItem>
              )}
              {isAuthenticated && user?.role === 'owner' && (
                <NavItem to="/admin" icon={<Settings size={16} />} active={is('/admin')}>
                  پنل مدیریت
                </NavItem>
              )}

              {/* Telegram */}
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
                پشتیبانی
              </a>
            </nav>

            {/* ── Auth Section Desktop ── */}
            <div className="hdr-desktop" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAuthenticated ? (
                <div style={{ position: 'relative' }}>
                  {/* User button */}
                  <button
                    className="hdr-user-btn"
                    onClick={() => setUserDropdown(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 14px 7px 10px',
                      borderRadius: '12px', border: `1.5px solid ${C.border}`,
                      background: 'white', cursor: 'pointer',
                      transition: 'all 0.2s',
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
                    <div style={{ textAlign: 'right' }}>
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
                          style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                          onClick={() => setUserDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: 'absolute', top: 'calc(100% + 10px)', left: 0,
                            minWidth: '200px', borderRadius: '16px',
                            background: 'white', border: `1px solid ${C.border}`,
                            boxShadow: '0 12px 40px rgba(124,58,237,0.12)',
                            overflow: 'hidden', zIndex: 20,
                          }}
                        >
                          {/* User info inside dropdown */}
                          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: '0.8rem', color: C.muted }}>وارد شده به عنوان</div>
                            <div style={{ fontWeight: 700, color: C.text, marginTop: '2px' }}>{user?.username}</div>
                          </div>
                          {/* Logout */}
                          <button
                            onClick={handleLogout}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '13px 16px', background: 'transparent', border: 'none',
                              cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
                              color: C.danger, textAlign: 'right', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.dangerLow}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <LogOut size={17} />
                            خروج از حساب
                          </button>
                        </motion.div>
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
                    ورود
                  </Link>
                  <Link to="/signup" style={{
                    padding: '8px 20px', minWidth: '120px', justifyContent: 'center', display: 'inline-flex', borderRadius: '10px', textDecoration: 'none',
                    fontSize: '0.9rem', fontWeight: 700, color: 'white',
                    background: C.brand, border: 'none',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                    transition: 'all 0.2s',
                  }}>
                    ثبت‌نام
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
                border: `1.5px solid ${C.border}`, background: C.accentLow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: C.brandSolid,
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? 'x' : 'm'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
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
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '300px', zIndex: 1000,
                background: 'white',
                boxShadow: '-8px 0 48px rgba(124,58,237,0.15)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
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
                    سالنیفای
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
                  صفحه اصلی
                </MobileNavItem>

                {isAuthenticated && !isOwnerOrStaff && (
                  <MobileNavItem to="/my-bookings" icon={<Calendar size={18} />} active={is('/my-bookings')} onClick={close}>
                    نوبت‌های من
                  </MobileNavItem>
                )}
                {isAuthenticated && isOwnerOrStaff && (
                  <MobileNavItem to="/owner-bookings" icon={<Calendar size={18} />} active={is('/owner-bookings')} onClick={close}>
                    رزروهای سالن
                  </MobileNavItem>
                )}
                {isAuthenticated && user?.role === 'owner' && (
                  <MobileNavItem to="/admin" icon={<Settings size={18} />} active={is('/admin')} onClick={close}>
                    پنل مدیریت
                  </MobileNavItem>
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
                  پشتیبانی تلگرام
                </a>
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
                    خروج از حساب
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
                      ورود
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
                      ثبت‌نام
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}