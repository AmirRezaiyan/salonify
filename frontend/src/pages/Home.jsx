import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Input } from '../components/Form';
import {
  Search,
  MapPin,
  Phone,
  Calendar,
  Scissors,
  Clock,
  Users,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Award,
  ArrowLeft,
  X,
  ChevronDown,
  Filter,
  Zap,
  Shield,
  Heart,
  Star,
  Smartphone,
  ListChecks,
  CalendarCheck,
  Store,
  UserCircle2,
  BellRing,
  Wallet,
  Settings,
  ChevronLeft,
  Copy,
  Check,
  Activity,
  AwardIcon,
  HelpCircle
} from 'lucide-react';
import { formatToman, toPersianNumber } from '../utils/formatCurrency';

/* ─────────────────────────── tiny helpers ─────────────────────────── */

const glass = {
  background: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.22)',
};

const card = {
  background: '#fff',
  borderRadius: '20px',
  boxShadow: '0 4px 24px rgba(30,41,59,0.08)',
  border: '1px solid #f1f5f9',
  overflow: 'hidden',
};

const normalizeGender = (value) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';

  const femaleHints = ['female', 'woman', 'women', 'lady', 'ladies', 'f', 'زن', 'زنانه', 'خانم', 'بانو'];
  const maleHints = ['male', 'man', 'men', 'gent', 'gents', 'm', 'مرد', 'مردانه', 'آقا', 'آقای'];

  if (femaleHints.some((hint) => raw === hint || raw.includes(hint))) return 'female';
  if (maleHints.some((hint) => raw === hint || raw.includes(hint))) return 'male';
  return raw;
};

const genderLabel = (value) => {
  const normalized = normalizeGender(value);
  if (normalized === 'female') return 'زنانه';
  if (normalized === 'male') return 'مردانه';
  return '';
};

/* ─────────────────────── Search Dialog Component ──────────────────── */

function SearchDialog({ open, onClose, searchQuery, setSearchQuery, selectedCity, setSelectedCity, allCities, salons = [], onSalonSelect }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Filter salons based on search query
  const filteredSalons = salons.filter(salon =>
    salon.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
            }}
          />

          {/* Dialog Centering Wrapper */}
          <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1001, pointerEvents: 'none',
          }}>
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              width: 'min(560px, 94vw)',
              background: '#fff',
              borderRadius: '28px',
              boxShadow: '0 32px 80px rgba(15,23,42,0.25)',
              overflow: 'hidden',
              pointerEvents: 'all',
            }}
          >
            {/* Dialog Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.75rem 1.75rem 1.5rem',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Search size={22} color="#fff" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                    جستجوی آرایشگاه
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', margin: 0, marginTop: '2px' }}>
                    نام آرایشگاه را جستجو کنید
                  </p>
                </div>
              </div>
            </div>

            {/* Dialog Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Search Input */}
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="نام آرایشگاه را جستجو کنید..."
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
                    borderRadius: '14px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    direction: 'rtl',
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <Search
                  size={20}
                  style={{
                    position: 'absolute', top: '50%', right: '14px',
                    transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute', top: '50%', left: '12px',
                      transform: 'translateY(-50%)',
                      background: '#f1f5f9', border: 'none', borderRadius: '50%',
                      width: '24px', height: '24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#64748b',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Salons List */}
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                {filteredSalons.length === 0
                  ? 'آرایشگاهی یافت نشد'
                  : `${toPersianNumber(filteredSalons.length)} آرایشگاه`}
              </p>
              <div style={{ maxHeight: '360px', overflowY: 'auto', paddingLeft: '4px' }}>
                {filteredSalons.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '2rem 1rem',
                    color: '#94a3b8', fontSize: '0.95rem',
                  }}>
                    <Search size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>
                      {searchQuery
                        ? 'آرایشگاهی با این نام یافت نشد'
                        : 'نام آرایشگاه را جستجو کنید'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredSalons.map(salon => (
                      <button
                        key={salon.id}
                        onClick={() => {
                          setSearchQuery('');
                          onClose();
                          if (onSalonSelect) onSalonSelect(salon);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#1e293b',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'right',
                          transition: 'all 0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.background = '#eef2ff';
                          e.currentTarget.style.color = '#667eea';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.color = '#1e293b';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <div
                            style={{
                              width: '40px', height: '40px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                              overflow: 'hidden',
                              border: '2px solid #e2e8f0',
                              flexShrink: 0,
                            }}
                          >
                            {salon.owner_image ? (
                              <img
                                src={salon.owner_image}
                                alt="Owner"
                                style={{
                                  width: '100%', height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              salon.name?.charAt(0) || 'S'
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{salon.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                              {salon.city}
                            </div>
                          </div>
                        </div>
                        {salon.average_rating > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            marginRight: '8px', flexShrink: 0,
                          }}>
                            <Star size={14} fill="#fbbf24" color="#fbbf24" />
                            <span style={{
                              fontWeight: 700, color: '#d97706',
                              fontSize: '0.85rem',
                            }}>
                              {toPersianNumber(salon.average_rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        )}
                        <ChevronDown size={16} style={{ transform: 'rotate(-90deg)', opacity: 0.5 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(102,126,234,0.35)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(102,126,234,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.35)'; }}
              >
                بستن
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────── City Selection Dialog ──────────────────── */

function CitySelectionDialog({ open, onClose, selectedCity, setSelectedCity, allCities }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
            }}
          />

          {/* Dialog Centering Wrapper */}
          <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1001, pointerEvents: 'none',
          }}>
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              width: 'min(560px, 94vw)',
              background: '#fff',
              borderRadius: '28px',
              boxShadow: '0 32px 80px rgba(15,23,42,0.25)',
              overflow: 'hidden',
              pointerEvents: 'all',
            }}
          >
            {/* Dialog Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.75rem 1.75rem 1.5rem',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={22} color="#fff" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                    انتخاب شهر
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', margin: 0, marginTop: '2px' }}>
                    شهر مورد نظر خود را انتخاب کنید
                  </p>
                </div>
              </div>
            </div>

            {/* Dialog Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* City Grid */}
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                انتخاب شهر
              </p>
              <div style={{ maxHeight: '360px', overflowY: 'auto', paddingLeft: '4px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                }}>
                  <button
                    onClick={() => { setSelectedCity(''); onClose(); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: `2px solid ${selectedCity === '' ? '#667eea' : '#e2e8f0'}`,
                      background: selectedCity === '' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8fafc',
                      color: selectedCity === '' ? '#fff' : '#475569',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    همه شهرها
                  </button>
                  {allCities.map(city => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); onClose(); }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: `2px solid ${selectedCity === city ? '#667eea' : '#e2e8f0'}`,
                        background: selectedCity === city ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8fafc',
                        color: selectedCity === city ? '#fff' : '#475569',
                        fontSize: '0.88rem',
                        fontWeight: selectedCity === city ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => {
                        if (selectedCity !== city) {
                          e.currentTarget.style.borderColor = '#a5b4fc';
                          e.currentTarget.style.background = '#eef2ff';
                        }
                      }}
                      onMouseLeave={e => {
                        if (selectedCity !== city) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(102,126,234,0.35)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(102,126,234,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.35)'; }}
              >
                اعمال فیلتر
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────── Main Component ──────────────────────── */

export default function Home() {
  const [tenant, setTenant] = useState(null);
  const [services, setServices] = useState([]);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformStats, setPlatformStats] = useState({});
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState(''); // New state for fetched QR url
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const iranianCities = [
    'تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'قم', 'کاشان', 'کرمانشاه',
    'بندرعباس', 'اهواز', 'یزد', 'کرج', 'اراک', 'همدان', 'خرم آباد', 'سنندج',
    'بجنورد', 'سبزوار', 'رشت', 'بابل', 'گرگان', 'رامسر', 'ساری', 'اردبیل',
    'زنجان', 'اردستان', 'بوشهر', 'خوی', 'مهاباد', 'مریوان', 'سانندج', 'قائم‌شهر',
    'لاهیجان', 'علی‌آباد', 'انزلی', 'چالوس', 'نوشهر', 'بابل', 'کلاچای', 'نیشابور',
  ];

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'owner' || user?.role === 'staff') {
        loadTenantAndServices();
      }
      loadAllSalons();
    } else {
      loadAllSalons();
    }
  }, [isAuthenticated, user]);

  const loadTenantAndServices = async () => {
    try {
      setLoading(true);

      let salonId = user?.salon?.id;
      let tenantData = user?.salon;

      if (!salonId) {
        const defaultHost = import.meta.env.VITE_SALON_HOST || 'amirbarber.ir';
        const salonHost = new URLSearchParams(window.location.search).get('host') ||
          localStorage.getItem('salon_host') ||
          defaultHost;

        localStorage.setItem('salon_host', salonHost);

        const tenantResponse = await api.getTenantByHost(salonHost);
        tenantData = tenantResponse.data;
        salonId = tenantData.id;
        localStorage.setItem('salon_id', salonId);
      } else {
        // If we already have the salonId, fetch the fresh, detailed salon data (with computed fields like average_rating)
        try {
          const salonResponse = await api.getSalon(salonId);
          if (salonResponse?.data) {
            tenantData = salonResponse.data;
          }
        } catch (salonErr) {
          console.warn('Failed to load fresh detailed salon data:', salonErr);
        }
      }

      setTenant(tenantData || user?.salon);

      if (salonId) {
        const servicesResponse = await api.getServices(salonId);
        // فیلتر کردن سرویس‌های با قیمت معتبر (> 0)
        setServices(servicesResponse.data.filter(s => s.price > 0));
      }

      // Fetch QR Code Link directly from API for Owner/Staff to ensure the exact booking link is used
      if (user?.role === 'owner' || user?.role === 'staff') {
        try {
          const qrResponse = await api.getQRCode();
          if (qrResponse?.data?.qr_url) {
            setQrUrl(qrResponse.data.qr_url);
          }
          // As a double safeguard, if QR response contains the detailed salon object, merge it!
          if (qrResponse?.data?.salon) {
            setTenant(prev => ({ ...prev, ...qrResponse.data.salon }));
          }
        } catch (qrErr) {
          console.warn('Failed to load QR code URL in Home:', qrErr);
        }
      }

      setError('');
    } catch (err) {
      console.error('Failed to load salon data:', err);
      setError('بارگذاری اطلاعات سالن ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllSalons = async () => {
    try {
      setLoading(true);
      let params = undefined;
      const ownedGender = normalizeGender(user?.salon?.gender || user?.gender);
      const customerGender = normalizeGender(user?.gender || user?.salon?.gender);

      if (isAuthenticated && (user?.role === 'owner' || user?.role === 'staff')) {
        if (ownedGender) params = { gender: ownedGender };
      } else if (isAuthenticated && user?.role === 'customer' && customerGender) {
        params = { gender: customerGender };
      }
      const response = await api.getAllSalons(params);
      setSalons(response.data);
      try {
        const statsResp = await api.getPlatformStats();
        setPlatformStats(statsResp.data || {});
      } catch (statsErr) {
        console.warn('Failed to load platform stats:', statsErr);
      }
      setError('');
    } catch (err) {
      console.error('Failed to load salons:', err);
      setError('بارگذاری لیست سالن‌ها ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSalons = () => {
    let filtered = salons;

    if (isAuthenticated && (user?.role === 'owner' || user?.role === 'staff') && user?.salon?.id) {
      filtered = filtered.filter(salon => salon.id !== user.salon.id);
    }

    if (isAuthenticated && user?.role === 'customer') {
      const viewerGender = normalizeGender(user?.gender || user?.salon?.gender);
      if (viewerGender) {
        filtered = filtered.filter(salon => normalizeGender(salon.gender) === viewerGender);
      }
    }

    if (selectedCity) {
      filtered = filtered.filter(salon =>
        salon.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(salon =>
        salon.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const handleCopyLink = (linkText) => {
    const el = document.createElement('textarea');
    el.value = linkText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const salonCities = [...new Set(salons.map(salon => salon.city).filter(Boolean))];
  const allCities = [...new Set([...iranianCities, ...salonCities])].sort();
  const filteredSalons = getFilteredSalons();

  if (loading) return <Loading />;

  const isOwnerOrStaff = user?.role === 'owner' || user?.role === 'staff';
  const isCustomer = user?.role === 'customer';

  /* ──────────────── Hero variants ──────────────── */

  const renderHero = () => {
    // Not authenticated
    if (!isAuthenticated) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          style={{ textAlign: 'center' }}
        >
          {/* Animated scissors icon */}
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            style={{ marginBottom: '2rem' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '96px', height: '96px', borderRadius: '28px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            }}>
              <Scissors size={52} style={{ color: '#fbbf24', filter: 'drop-shadow(0 4px 16px rgba(251,191,36,0.6))' }} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{
              color: '#fff',
              fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
              fontWeight: 900,
              margin: '0 0 1.25rem',
              textShadow: '0 4px 32px rgba(0,0,0,0.25)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            به <span style={{ color: '#fbbf24' }}>سالنیفای</span> خوش‌آمدید
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
              maxWidth: '640px',
              margin: '0 auto 1rem',
              lineHeight: 1.85,
            }}
          >
            پلتفرمی برای نوبت‌دهی آنلاین آرایشگاه‌ها؛ آرایشگاه مورد نظرتان را پیدا کنید،
            خدمت دلخواه را انتخاب کنید و در چند ثانیه نوبت بگیرید
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: 'clamp(0.88rem, 1.8vw, 1rem)',
              maxWidth: '560px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.8,
            }}
          >
            بدون نیاز به تماس تلفنی یا حضور حضوری، آرایشگاه‌های ثبت‌شده در پلتفرم را مرور کنید
            و نوبت خودتان را مدیریت کنید. صاحبان سالن نیز می‌توانند خدمات و نوبت‌های خود را از
            طریق پنل مدیریتی کنترل کنند.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button
              onClick={() => navigate('/signup')}
              style={{
                minWidth: 220,
                width: 220,
                height: 56,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: '50px',
                border: 'none',
                background: '#fbbf24',
                color: '#1e293b',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 8px 28px rgba(251,191,36,0.4)',
                transition: 'all 0.25s',
                textAlign: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(251,191,36,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(251,191,36,0.4)'; }}
            >
              <span style={{ display: 'block', lineHeight: 1, marginBottom: 4 }}>شروع کنید — رایگان</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                minWidth: 220,
                width: 220,
                height: 56,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: '50px',
                border: '2px solid rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.25s',
                textAlign: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            >
              <span style={{ display: 'block', lineHeight: 1, marginBottom: 4 }}>ورود به حساب</span>
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              display: 'flex', gap: '1.5rem', justifyContent: 'center',
              marginTop: '3rem', flexWrap: 'wrap',
            }}
          >
            {[
              { icon: <CheckCircle size={16} />, text: 'ثبت‌نام رایگان' },
              { icon: <Smartphone size={16} />, text: 'بدون نیاز به نصب اپلیکیشن' },
              { icon: <Clock size={16} />, text: 'رزرو در هر ساعت از شبانه‌روز' },
            ].map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem',
                background: 'rgba(255,255,255,0.1)',
                padding: '10px 14px', borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.2)',
                width: 211,
                justifyContent: 'center',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {b.icon}<span>{b.text}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      );
    }

    // Owner / Staff (Enhanced Panel Overview)
    if (isOwnerOrStaff) {
      const salonName = tenant?.name || user?.salon?.name;
      const ownerName = user?.full_name || 'مدیر گرامی';
      
      return (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ 
            textAlign: 'center',
            maxWidth: '820px',
            margin: '0 auto',
            padding: '1rem 0'
          }}
        >
          {/* Dashboard Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '8px 18px',
              borderRadius: '50px',
              color: '#fbbf24',
              fontSize: '0.88rem',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              marginBottom: '1.5rem'
            }}
          >
            <Sparkles size={16} fill="#fbbf24" style={{ filter: 'drop-shadow(0 2px 8px rgba(251,191,36,0.5))' }} />
            <span>پنل حرفه‌ای مدیریت سالن</span>
          </motion.div>

          <h1 style={{
            color: '#fff',
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            margin: '0 0 0.75rem',
            textShadow: '0 4px 24px rgba(0,0,0,0.2)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            مدیریت سالن <span style={{ color: '#fbbf24' }}>{salonName || 'شما'}</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.8,
            fontWeight: 500
          }}>
            سلام {ownerName}؛ به پیشخوان مدیریت سالن خود خوش آمدید. نوبت‌ها و خدمات خود را با ابزارهای زیر بهینه‌سازی کنید.
          </p>

          {/* Elegant Dashboard Buttons Block */}
</motion.div>
      );
    }

    // Customer
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center' }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '90px', height: '90px', borderRadius: '26px',
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.28)',
          }}>
            <Heart size={44} style={{ color: '#fbbf24', filter: 'drop-shadow(0 4px 12px rgba(251,191,36,0.5))' }} />
          </div>
        </motion.div>

        {/* Greeting pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: '50px',
            padding: '10px 24px',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>خوش اومدی</div>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
              {user?.full_name || user?.name || 'مشتری گرامی'}
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            color: '#fff',
            fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)',
            fontWeight: 900,
            margin: '0 0 1rem',
            textShadow: '0 4px 24px rgba(0,0,0,0.22)',
            letterSpacing: '-0.02em',
          }}
        >
          {viewerGenderLabel ? `بهترین آرایشگاه‌های ${viewerGenderLabel} را پیدا کن ✨` : 'بهترین آرایشگاه را پیدا کن ✨'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            maxWidth: '560px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.85,
          }}
        >
          {viewerGenderLabel ? `جستجو کن، نوبت بگیر و فقط سالن‌های ${viewerGenderLabel} را ببین!` : 'جستجو کن، نوبت بگیر و بدون انتظار برو آرایشگاه!'}
        </motion.p>

      </motion.div>
    );
  };

  /* ──────────────────────────── Render ──────────────────────────── */

  // Dynamic values computation for the real-time operational dashboard (Fully robust with parseFloat support)
  const activeServicesCount = services.filter(s => s.is_active).length;
  const inactiveServicesCount = services.filter(s => !s.is_active).length;
  const averagePrice = services.length > 0 
    ? Math.round(services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0) / services.length) 
    : 0;
  
  // Create sharing booking link based on current domain or tenant/host values
  const rawHost = tenant?.host || localStorage.getItem('salon_host') || window.location.host;
  const shareableBookingLink = rawHost ? `https://${rawHost}` : `${window.location.origin}/services?salon=${tenant?.id || ""}`;

  // Robust determination of salon specialty gender
  const rawGender = tenant?.gender || user?.salon?.gender || user?.gender || 'male';
  const normalizedGender = normalizeGender(rawGender);
  const isMale = normalizedGender === 'male';
  const viewerGenderLabel = genderLabel(user?.gender || user?.salon?.gender);

  // Defensive Multi-Path & Parsing Strategy for Fetching Rating Values 
  const getDisplayRating = () => {
    const possibleValues = [
      tenant?.average_rating,
      tenant?.rating,
      user?.salon?.average_rating,
      user?.salon?.rating,
      user?.average_rating,
      user?.rating,
      tenant?.settings?.rating,
      tenant?.settings?.average_rating
    ];
    for (let val of possibleValues) {
      if (val !== undefined && val !== null && val !== '') {
        // Convert any Persian numbers to English to ensure compatibility with parseFloat
        let strVal = String(val).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        const num = parseFloat(strVal);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
    }
    return null;
  };

  const ratingValue = getDisplayRating();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', direction: 'rtl' }}>

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        allCities={allCities}
        salons={salons}
        onSalonSelect={(salon) => {
          localStorage.setItem('selected_salon_id', salon.id);
          localStorage.setItem('selected_salon_name', salon.name);
          navigate('/services');
        }}
      />

      {/* City Selection Dialog */}
      <CitySelectionDialog
        open={cityDialogOpen}
        onClose={() => setCityDialogOpen(false)}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        allCities={allCities}
      />

      {/* ─── HERO ─── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 'clamp(4rem, 10vw, 6rem) 1.5rem clamp(3.5rem, 12vw, 5rem)',
        overflow: 'hidden',
      }}>
        {/* Blob decorations */}
        {[
          { top: '-15%', right: '-8%', size: '500px', opacity: 0.12 },
          { bottom: '-20%', left: '-10%', size: '420px', opacity: 0.1 },
          { top: '30%', left: '20%', size: '280px', opacity: 0.07 },
        ].map((blob, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: blob.top, bottom: blob.bottom,
            left: blob.left, right: blob.right,
            width: blob.size, height: blob.size,
            background: `rgba(255,255,255,${blob.opacity})`,
            borderRadius: '50%',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }} />
        ))}

        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {renderHero()}
        </div>

        {/* Wave bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', lineHeight: 0 }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
            <path d="M0,40 C360,70 1080,10 1440,40 L1440,60 L0,60 Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5',
              borderRadius: '14px', padding: '1rem 1.25rem',
              color: '#dc2626', marginBottom: '2rem',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}
          >
            <X size={18} />
            {error}
          </motion.div>
        )}

        {/* ─── FEATURES SECTION (always shown) ─── */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '5rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: isCustomer ? '#fdf2f8' : '#eef2ff', borderRadius: '50px',
              padding: '8px 20px', marginBottom: '1.25rem',
            }}>
              <Award size={18} style={{ color: isCustomer ? '#ec4899' : '#667eea' }} />
              <span style={{ color: isCustomer ? '#ec4899' : '#667eea', fontSize: '0.9rem', fontWeight: 700 }}>
                {isCustomer ? 'چرا سالنیفای؟' : 'چرا سالنیفای؟'}
              </span>
            </div>
            <h2 style={{
              color: '#1e293b',
              fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
              fontWeight: 800,
              margin: '0 0 0.75rem',
              letterSpacing: '-0.02em',
            }}>
              {isCustomer ?'چند کلیک تا رزرو نوبت' : 'تجربه‌ای متفاوت در نوبت‌دهی'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
              {isCustomer ? 'بدون تماس تلفنی، بدون انتظار — فقط رزرو کن و برو' : 'همه چیز را در یک پلتفرم مدیریت کنید'}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}>
            {(isCustomer ? [
              {
                icon: <Search size={36} />,
                title: 'آرایشگاه مناسب خودت رو پیدا کن',
                desc: 'از بین آرایشگاه‌های ثبت‌شده در شهرت جستجو کن، امتیاز و نظرات رو ببین و انتخاب کن',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                bg: '#f5f3ff',
              },
              {
                icon: <CalendarCheck size={36} />,
                title: 'نوبتت رو آنلاین بگیر',
                desc: 'خدمت دلخواه، قیمت و زمان مناسب رو انتخاب کن — نوبت در چند ثانیه ثبت میشه',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                bg: '#fff1f5',
              },
              {
                icon: <Clock size={36} />,
                title: 'بدون انتظار، سر وقت برو',
                desc: 'وقتی نوبتت ثبته، دیگه لازم نیست زود بری و منتظر بمونی — سر ساعت برو آرایشگاه',
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                bg: '#f0f9ff',
              },
              {
                icon: <Star size={36} />,
                title: 'بهترین‌ها رو انتخاب کن',
                desc: 'امتیاز و نظرات مشتریان قبلی کمکت می‌کنه بهترین آرایشگاه رو با اطمینان انتخاب کنی',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                bg: '#fffbeb',
              },
            ] : [
              {
                icon: <Calendar size={36} />,
                title: 'مدیریت هوشمند نوبت‌ها',
                desc: 'کنترل کامل رزروها و برنامه‌ریزی دقیق کاری در هر ساعت از شبانه‌روز',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                bg: '#f5f3ff',
              },
              {
                icon: <Scissors size={36} />,
                title: 'دیده شدن در برترین‌ها',
                desc: 'نمایش حرفه‌ای سالن شما در کنار بهترین‌های شهر، جهت جذب مشتریان جدید و معتبر',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                bg: '#fff1f5',
              },
              {
                icon: <Clock size={36} />,
                title: 'بهینه‌سازی زمان و درآمد',
                desc: 'کاهش کنسلی‌ها و مدیریت دقیق زمان‌بندی برای افزایش بهره‌وری و درآمد سالن',
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                bg: '#f0f9ff',
              },
              {
                icon: <Users size={36} />,
                title: 'پنل مدیریت حرفه‌ای',
                desc: 'ابزارهای گزارش‌گیری و تیم پشتیبانی اختصاصی برای مدیریت ساده و سریع کسب‌وکارتان',
                gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                bg: '#f0fdf4',
              },
            ]).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '2rem 1.75rem',
                  textAlign: 'right',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid #f1f5f9',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, right: 0, left: 0,
                  height: '4px', background: feature.gradient,
                }} />
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '72px', height: '72px', borderRadius: '18px',
                  background: feature.bg,
                  marginBottom: '1.25rem',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: feature.gradient, color: '#fff',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                  }}>
                    {feature.icon}
                  </div>
                </div>
                <h3 style={{ color: '#1e293b', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.6rem', margin: '0 0 0.6rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '0.95rem', margin: 0 }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── HOW IT WORKS (Guest only) ─── */}
        {!isAuthenticated && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: '5rem' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#eef2ff', borderRadius: '50px',
                padding: '8px 20px', marginBottom: '1.25rem',
              }}>
                <ListChecks size={18} style={{ color: '#667eea' }} />
                <span style={{ color: '#667eea', fontSize: '0.9rem', fontWeight: 700 }}>چطور کار می‌کند؟</span>
              </div>
              <h2 style={{
                color: '#1e293b',
                fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
                fontWeight: 800,
                margin: '0 0 0.75rem',
                letterSpacing: '-0.02em',
              }}>
                در سه قدم نوبت بگیرید
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
                از جستجو تا رزرو، تنها چند کلیک فاصله دارید
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '2rem',
              position: 'relative',
            }}>
              {[
                {
                  icon: <Search size={30} />,
                  title: 'آرایشگاه را پیدا کنید',
                  desc: 'با جستجو بر اساس نام یا شهر، آرایشگاه مورد نظرتان را در پلتفرم پیدا کنید',
                  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                },
                {
                  icon: <ListChecks size={30} />,
                  title: 'خدمت را انتخاب کنید',
                  desc: 'لیست خدمات، قیمت و مدت‌زمان هر کدام را ببینید و خدمت مدنظرتان را انتخاب کنید',
                  gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                },
                {
                  icon: <CalendarCheck size={30} />,
                  title: 'نوبت بگیرید',
                  desc: 'زمان مناسب خودتان را انتخاب کنید و نوبت‌تان ثبت می‌شود؛ همین‌قدر ساده',
                  gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  style={{ textAlign: 'center', position: 'relative' }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.15 + 0.1 }}
                    style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}
                  >
                    <div style={{
                      width: '88px', height: '88px', borderRadius: '24px',
                      background: step.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 10px 28px rgba(102,126,234,0.25)',
                      margin: '0 auto',
                    }}>
                      {step.icon}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '-8px', right: '50%',
                      transform: 'translateX(40px)',
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: '#1e293b', color: '#fff',
                      fontWeight: 900, fontSize: '0.95rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '3px solid #fff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    }}>
                      {index + 1}
                    </div>
                  </motion.div>
                  <h3 style={{ color: '#1e293b', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.6rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '0.93rem', margin: '0 auto', maxWidth: '260px' }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── WHO IT'S FOR (Guest only) ─── */}
        {!isAuthenticated && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: '5rem' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#fff1f5', borderRadius: '50px',
                padding: '8px 20px', marginBottom: '1.25rem',
              }}>
                <Users size={18} style={{ color: '#f5576c' }} />
                <span style={{ color: '#f5576c', fontSize: '0.9rem', fontWeight: 700 }}>برای چه کسانی مناسب است؟</span>
              </div>
              <h2 style={{
                color: '#1e293b',
                fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
                fontWeight: 800,
                margin: '0 0 0.75rem',
                letterSpacing: '-0.02em',
              }}>
                هم برای مشتری، هم برای صاحب سالن
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.75rem',
            }}>
              {/* Customer card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  background: '#fff', borderRadius: '24px',
                  padding: '2.25rem', border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 24px rgba(30,41,59,0.07)',
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', marginBottom: '1.5rem',
                  boxShadow: '0 8px 20px rgba(102,126,234,0.3)',
                }}>
                  <UserCircle2 size={32} />
                </div>
                <h3 style={{ color: '#1e293b', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1.1rem' }}>
                  مشتری‌ها
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {[
                    { icon: <Search size={18} />, text: 'جستجوی آرایشگاه‌های ثبت‌شده در پلتفرم بر اساس نام یا شهر' },
                    { icon: <Wallet size={18} />, text: 'مشاهده دقیق قیمت و مدت‌زمان هر خدمت پیش از رزرو' },
                    { icon: <CalendarCheck size={18} />, text: 'رزرو و مدیریت نوبت‌ها از طریق حساب کاربری شخصی' },
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: '#667eea', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
                      <span style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7 }}>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    width: '100%', marginTop: '1.75rem', padding: '13px',
                    borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 18px rgba(102,126,234,0.25)',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  ثبت‌نام به‌عنوان مشتری
                  <ArrowLeft size={16} />
                </button>
              </motion.div>

              {/* Salon owner card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  background: '#fff', borderRadius: '24px',
                  padding: '2.25rem', border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 24px rgba(30,41,59,0.07)',
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', marginBottom: '1.5rem',
                  boxShadow: '0 8px 20px rgba(245,87,108,0.3)',
                }}>
                  <Store size={32} />
                </div>
                <h3 style={{ color: '#1e293b', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1.1rem' }}>
                  صاحبان سالن
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {[
                    { icon: <Scissors size={18} />, text: 'تعریف و مدیریت خدمات سالن همراه با قیمت و مدت‌زمان' },
                    { icon: <BellRing size={18} />, text: 'مشاهده و مدیریت نوبت‌های ثبت‌شده توسط مشتریان' },
                    { icon: <Users size={18} />, text: 'معرفی سالن به مشتریان جدید از طریق پلتفرم' },
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: '#f5576c', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
                      <span style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7 }}>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    width: '100%', marginTop: '1.75rem', padding: '13px',
                    borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 18px rgba(245, 104, 108, 0.25)',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  ثبت‌نام سالن من
                  <ArrowLeft size={16} />
                </button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ─── SALON DASHBOARD PANEL (Owner / Staff - Premium & Real-time Statistics) ─── */}
        {isAuthenticated && isOwnerOrStaff && (
          <motion.section
            id="salon-monitoring-dashboard"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: '5rem' }}
          >
            {/* Dashboard Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '1.5rem'
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Activity size={24} style={{ color: '#667eea' }} />
                  <h2 style={{
                    color: '#1e293b', fontSize: 'clamp(1.5rem, 4.5vw, 2.1rem)',
                    fontWeight: 850, margin: 0,
                  }}>
                    میز مانیتورینگ و وضعیت سالن
                  </h2>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                  ابزارهای حیاتی کاربری و تحلیل آماری زنده بر اساس وضعیت واقعی سیستم شما.
                </p>
              </div>
            </div>

            {/* Dashboard 3-Column Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}>
              {/* Card 1: Unique Booking Link (Extremely Useful for Salon Owners - Now using exact QR URL) */}
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  ...card,
                  borderRadius: '24px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(to bottom, #ffffff, #fdfdfd)',
                  boxShadow: '0 10px 30px rgba(99, 102, 241, 0.05)',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '24px 24px 0 0'
                }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: '#eef2ff', color: '#4f46e5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Copy size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                      لینک اختصاصی نوبت‌دهی
                    </h3>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                    این لینک اختصاصی سالن شماست. آن را کپی کرده و در بیو اینستاگرام، پیامک‌ها یا کانال‌های ارتباطی خود قرار دهید تا مشتریان مستقیماً نوبت بگیرند.
                  </p>
                  
                  {/* Visual copy input field */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '1.5rem',
                    direction: 'ltr'
                  }}>
                    <span style={{
                      color: '#475569',
                      fontSize: '0.82rem',
                      fontWeight: 650,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {qrUrl || shareableBookingLink}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyLink(qrUrl || shareableBookingLink)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: copied ? '#10b981' : '#4f46e5',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: copied ? '0 4px 14px rgba(16, 185, 129, 0.2)' : '0 4px 14px rgba(79, 70, 229, 0.2)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      لینک با موفقیت کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      کپی کردن لینک نوبت‌دهی
                    </>
                  )}
                </button>
              </motion.div>

              {/* Card 2: Real-time Computed Services & Pricing Insights */}
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  ...card,
                  borderRadius: '24px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(to bottom, #ffffff, #fdfdfd)',
                  boxShadow: '0 10px 30px rgba(245, 158, 11, 0.05)',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '24px 24px 0 0'
                }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: '#fffbeb', color: '#d97706',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Scissors size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                      وضعیت خدمات و قیمت‌ها
                    </h3>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                    خلاصه‌ای از خدمات فعال شما در سامانه نوبت‌دهی سالنیفای به همراه برآورد ارزش و میانگین قیمت واقعی تراکنش‌های سالن شما.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>خدمات فعال برای مشتریان:</span>
                      <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {activeServicesCount} خدمت
                        <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                      </span>
                    </div>
                    {inactiveServicesCount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>خدمات غیرفعال موقت:</span>
                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.95rem' }}>
                          {inactiveServicesCount} خدمت
                        </span>
                      </div>
                    )}
                    <div style={{
                      borderTop: '1px dashed #e2e8f0',
                      paddingTop: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>میانگین ارزش خدمات سالن:</span>
                      <span style={{ color: '#4f46e5', fontWeight: 900, fontSize: '1.1rem' }}>
                        {averagePrice > 0 ? formatToman(averagePrice) : 'هنوز محاسبه نشده'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  textAlign: 'center',
                  fontWeight: 550,
                  border: '1px solid #f1f5f9'
                }}>
                  تعداد کل خدمات تعریف شده: {toPersianNumber(services.length)} مورد
                </div>
              </motion.div>

              {/* Card 3: Salon Identity Profile Summary */}
              <motion.div
                whileHover={{ y: -4 }}
                style={{
                  ...card,
                  borderRadius: '24px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(to bottom, #ffffff, #fdfdfd)',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.05)',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '24px 24px 0 0'
                }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: '#ecfdf5', color: '#10b981',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Store size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                      شناسنامه دیجیتال سالن
                    </h3>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                    خلاصه‌ای از ساختار و مشخصاتی که مشتریان شما در پروفایل نوبت‌دهی خود مشاهده می‌کنند. اطلاعات تکمیلی در تب تنظیمات قابل ویرایش است.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>شهر فعالیت ثبت‌شده:</span>
                      <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>
                        {tenant?.city || user?.salon?.city || 'بدون شهر ثبت شده'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>تخصص جنسیتی سالن:</span>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: 800,
                        background: isMale ? '#eef2ff' : '#fff1f5',
                        color: isMale ? '#4f46e5' : '#f5576c'
                      }}>
                        {isMale ? '♂ تخصصی آقایان' : '♀ تخصصی بانوان'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>میانگین امتیاز مشتریان:</span>
                      <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={16} fill="#fbbf24" color="#fbbf24" />
                        {ratingValue !== null ? toPersianNumber(ratingValue, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : 'بدون امتیاز'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  textAlign: 'center',
                  fontWeight: 550,
                  border: '1px solid #f1f5f9'
                }}>
                  تلفن تماس: {tenant?.phone || user?.salon?.phone || 'ثبت نشده'}
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ─── DISCOVERY SECTION (Customer only) ─── */}
        {isAuthenticated && isCustomer && (() => {
          const TOP_COUNT = 5;
          const viewerGender = normalizeGender(user?.gender || user?.salon?.gender);
          const viewerCity = String(user?.city || '').trim().toLowerCase();

          /* Pool: gender + city filtered — only show salons the customer can actually book from */
          const pool = salons.filter(s => {
            if (viewerGender && normalizeGender(s.gender) !== viewerGender) return false;
            if (viewerCity && String(s.city || '').trim().toLowerCase() !== viewerCity) return false;
            return true;
          });

          /* Top 5 by rating, then review_count as tiebreaker */
          const topRated = [...pool]
            .sort((a, b) => {
              const ratingDiff = (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0);
              if (ratingDiff !== 0) return ratingDiff;
              return (b.review_count || 0) - (a.review_count || 0);
            })
            .slice(0, TOP_COUNT);

          /* ── Shared sub-components ── */

          const SalonCard = ({ salon, rank }) => {
            const isMaleSalon = normalizeGender(salon.gender) === 'male';
            const rating = parseFloat(salon.average_rating) || 0;
            const gradient = isMaleSalon
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';

            let ownerPos = { x: 50, y: 50 };
            try {
              const pos = salon?.settings?.owner_image_position;
              if (pos) {
                const parsed = typeof pos === 'string' ? JSON.parse(pos) : pos;
                if (parsed?.x !== undefined) ownerPos = parsed;
              }
            } catch {}

            const rankColors = ['#f59e0b', '#94a3b8', '#cd7c3b', '#6366f1', '#10b981'];
            const rankBg = ['#fffbeb', '#f8fafc', '#fff7ed', '#eef2ff', '#f0fdf4'];
            const rankColor = rankColors[rank] || '#94a3b8';
            const rankBgColor = rankBg[rank] || '#f8fafc';

            // let ownerPos = { x: 50, y: 50 };
            // try {
            //   const pos = salon?.settings?.owner_image_position;
            //   if (pos) {
            //     const parsed = typeof pos === 'string' ? JSON.parse(pos) : pos;
            //     if (parsed?.x !== undefined) ownerPos = parsed;
            //   }
            // } catch {}

            return (
              <motion.div
                whileHover={{ y: -8, boxShadow: '0 28px 56px rgba(30,41,59,0.16)' }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  localStorage.setItem('selected_salon_id', salon.id);
                  localStorage.setItem('selected_salon_name', salon.name);
                  navigate('/services');
                }}
                style={{
                  background: '#fff',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(30,41,59,0.08)',
                  border: '1px solid #f1f5f9',
                  minWidth: '240px',
                  maxWidth: '270px',
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Rank badge */}
                <div style={{
                  position: 'absolute', top: '12px', left: '12px', zIndex: 10,
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: rankBgColor,
                  border: `2px solid ${rankColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.82rem',
                  color: rankColor,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}>
                  {rank + 1}
                </div>

                {/* Card banner */}
                <div style={{
                  height: '130px',
                  background: gradient,
                  position: 'relative',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  flexShrink: 0,
                  paddingBottom: '0',
                }}>
                  {/* dot pattern */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />
                  {/* large blurred circle for depth */}
                  <div style={{
                    position: 'absolute', bottom: '-30px', right: '-20px',
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    filter: 'blur(20px)', pointerEvents: 'none',
                  }} />

                  {/* Avatar — floats half out of banner */}
                  <div style={{
                    position: 'relative', zIndex: 2,
                    marginBottom: '-28px',
                    width: '66px', height: '66px', borderRadius: '50%',
                    border: '4px solid #fff',
                    overflow: 'hidden',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
                    background: 'rgba(255,255,255,0.22)',
                    flexShrink: 0,
                  }}>
                    {salon.owner_image ? (
                      <img
                        src={salon.owner_image}
                        alt={salon.name}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          objectPosition: `${ownerPos.x}% ${ownerPos.y}%`,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Scissors size={26} color="#fff" />
                      </div>
                    )}
                  </div>

                  {/* Gender pill */}
                  {salon.gender && (
                    <span style={{
                      position: 'absolute', top: '12px', right: '12px',
                      background: 'rgba(255,255,255,0.95)',
                      color: isMaleSalon ? '#667eea' : '#f5576c',
                      padding: '3px 10px', borderRadius: '50px',
                      fontSize: '0.72rem', fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      zIndex: 2,
                    }}>
                      {isMaleSalon ? '♂ مردانه' : '♀ زنانه'}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '2rem 1.25rem 1.35rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.55rem', textAlign: 'center' }}>
                  <h3 style={{
                    color: '#1e293b', fontSize: '1.02rem', fontWeight: 800,
                    margin: 0, lineHeight: 1.3,
                  }}>
                    {salon.name}
                  </h3>

                  {salon.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.8rem', justifyContent: 'center' }}>
                      <MapPin size={12} style={{ color: '#667eea', flexShrink: 0 }} />
                      {salon.city}
                    </div>
                  )}

                  {/* Rating stars row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    justifyContent: 'center', marginTop: '2px',
                  }}>
                    {rating > 0 ? (
                      <>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(s => (
                            <Star
                              key={s}
                              size={13}
                              fill={s <= Math.round(rating) ? '#fbbf24' : '#e2e8f0'}
                              color={s <= Math.round(rating) ? '#fbbf24' : '#e2e8f0'}
                            />
                          ))}
                        </div>
                        <span style={{ fontWeight: 800, color: '#d97706', fontSize: '0.88rem' }}>
                          {rating.toFixed(1)}
                        </span>
                        {salon.review_count > 0 && (
                          <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                            ({toPersianNumber(salon.review_count)} نظر)
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>بدون امتیاز</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      localStorage.setItem('selected_salon_id', salon.id);
                      localStorage.setItem('selected_salon_name', salon.name);
                      navigate('/services');
                    }}
                    style={{
                      marginTop: '0.6rem',
                      padding: '11px',
                      borderRadius: '14px', border: 'none',
                      background: gradient,
                      color: '#fff', fontSize: '0.88rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: '0 4px 16px rgba(102,126,234,0.25)',
                      transition: 'all 0.22s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(102,126,234,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(102,126,234,0.25)'; }}
                  >
                    رزرو نوبت
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </motion.div>
            );
          };

          /* Empty state */
          if (pool.length === 0) {
            return (
              <motion.section
                id="salons"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{ marginBottom: '5rem' }}
              >
                <div style={{
                  textAlign: 'center', padding: '5rem 2rem',
                  background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                  borderRadius: '28px', border: '2px dashed #cbd5e1',
                }}>
                  <Scissors size={56} style={{ color: '#c7d2fe', marginBottom: '1.25rem' }} />
                  <h3 style={{ color: '#475569', fontSize: '1.4rem', margin: '0 0 0.5rem', fontWeight: 700 }}>
                    هنوز آرایشگاهی ثبت نشده
                  </h3>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
                    به زودی آرایشگاه‌های جدید اضافه می‌شوند
                  </p>
                </div>
              </motion.section>
            );
          }

          return (
            <motion.section
              id="salons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '5rem' }}
            >
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{ textAlign: 'center', marginBottom: '2.5rem' }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                  border: '1px solid #fde68a',
                  borderRadius: '50px',
                  padding: '7px 18px', marginBottom: '1rem',
                }}>
                  <Award size={15} style={{ color: '#d97706' }} />
                  <span style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 700 }}>برترین آرایشگاه‌ها</span>
                </div>
                <h2 style={{
                  color: '#1e293b',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 900, margin: '0 0 0.5rem',
                  letterSpacing: '-0.02em',
                }}>
                  {viewerGenderLabel
                    ? `بهترین آرایشگاه‌های ${viewerGenderLabel} بر اساس امتیاز`
                    : 'بهترین آرایشگاه‌ها بر اساس امتیاز'}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                  ۵ آرایشگاه برتر که مشتریان بیشترین رضایت را داشته‌اند
                </p>
              </motion.div>

              {/* Scrollable card track */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div style={{
                  display: 'flex', gap: '1.25rem',
                  overflowX: 'auto',
                  paddingBottom: '16px',
                  paddingTop: '8px',
                  paddingRight: '4px',
                  paddingLeft: '4px',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                }}>
                  {topRated.map((salon, index) => (
                    <motion.div
                      key={salon.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                      style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                    >
                      <SalonCard salon={salon} rank={index} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* ── View All CTA ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{
                  marginTop: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '24px',
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                  backgroundSize: '28px 28px', pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.15)', borderRadius: '50px',
                    padding: '6px 16px', marginBottom: '1rem',
                  }}>
                    <Scissors size={14} color="#fbbf24" />
                    <span style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700 }}>
                      {salons.length > 0 ? `${toPersianNumber(salons.length)}+ آرایشگاه در پلتفرم` : 'آرایشگاه‌های بیشتر'}
                    </span>
                  </div>
                  <h3 style={{
                    color: '#fff', fontSize: 'clamp(1.2rem, 3vw, 1.7rem)',
                    fontWeight: 900, margin: '0 0 0.5rem',
                  }}>
                    آرایشگاه بیشتری می‌خوای پیدا کنی؟
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.82)', fontSize: '0.95rem',
                    margin: '0 0 1.75rem', lineHeight: 1.7,
                  }}>
                    در صفحه آرایشگاه‌ها می‌تونی با فیلتر شهر، جنسیت و جستجو، دقیقاً همون رو که می‌خوای پیدا کنی
                  </p>
                  <button
                    onClick={() => navigate('/salons')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '10px',
                      padding: '14px 36px', borderRadius: '50px', border: 'none',
                      background: '#fff',
                      color: '#667eea', fontSize: '1rem', fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
                      transition: 'all 0.25s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)'; }}
                  >
                    مشاهده همه آرایشگاه‌ها
                    <ArrowLeft size={18} />
                  </button>
                </div>
              </motion.div>
            </motion.section>
          );
        })()}

        {/* ─── PLATFORM STATS (only rendered when real data exists) ─── */}
        {platformStats && (platformStats.salons_count > 0 || platformStats.confirmed_bookings > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '32px',
            padding: '4rem 2.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: '-20%', right: '-8%',
            width: '450px', height: '450px',
            background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
            filter: 'blur(80px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-25%', left: '-8%',
            width: '380px', height: '380px',
            background: 'rgba(255,255,255,0.06)', borderRadius: '50%',
            filter: 'blur(70px)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', duration: 0.8 }}
              >
                <TrendingUp size={52} style={{ color: '#fbbf24', marginBottom: '1rem' }} />
              </motion.div>
              <h2 style={{
                color: '#fff', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)',
                fontWeight: 900, margin: '0 0 0.75rem',
                textShadow: '0 4px 24px rgba(0,0,0,0.2)',
              }}>
               اعتماد کاربران به پلتفرم ما در یک نگاه
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.88)',
                fontSize: '1.05rem', maxWidth: '600px',
                margin: '0 auto', lineHeight: 1.85,
              }}>
                با پلتفرم ما تجربه‌ای سریع، مطمئن و راحت از نوبت‌دهی آنلاین داشته باشید
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem', maxWidth: '900px', margin: '0 auto',
            }}>
              {[
                {
                  value: (platformStats.salons_count || 0).toLocaleString('fa-IR'),
                  label: 'آرایشگاه همکار',
                  icon: <Scissors size={30} />,
                },
                {
                  value: (platformStats.confirmed_bookings || 0).toLocaleString('fa-IR'),
                  label: 'نوبت موفق',
                  icon: <CheckCircle size={30} />,
                },
                {
                  value: `${(platformStats.satisfaction_percent || 0).toLocaleString('fa-IR')}%`,
                  label: 'رضایت کاربران',
                  icon: <Star size={30} />,
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '20px',
                    padding: '2rem 1.25rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ color: '#fbbf24', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                    {stat.icon}
                  </div>
                  <div style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 900, color: '#fff',
                    marginBottom: '0.4rem',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.98rem', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
        )}
      </div>
    </div>
  );
}