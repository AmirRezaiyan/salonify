import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/QRScanner.css';

const QRScanner = () => {
  const navigate = useNavigate();
  const { qrCode } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [salon, setSalon] = useState(null);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchSalon = async () => {
      if (!qrCode) {
        setError('QR Code معتبر نیست');
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        const response = await api.getSalonByQRCode(qrCode);
        const salonData = response.data;
        setSalon(salonData);

        // ذخیره در localStorage تا بعد از لاگین/ثبت‌نام هم در دسترس باشه
        localStorage.setItem('selected_salon_id', String(salonData.id));
        localStorage.setItem('selected_salon_name', salonData.name || '');
        localStorage.setItem('qr_redirect_after_auth', '/services');

        // اگر لاگین بود مستقیم بره
        if (isAuthenticated) {
          navigate('/services');
        }
      } catch (err) {
        console.error('خطا در دریافت سالن:', err);
        setError(err.response?.data?.error || 'سالن با این QR Code پیدا نشد');
      } finally {
        setLoadingData(false);
      }
    };

    fetchSalon();
  }, [qrCode, isAuthenticated, authLoading, navigate]);

  const handleGoToLogin = () => {
    navigate('/login', {
      state: { from: 'qr', salonId: salon?.id, redirectTo: '/services' }
    });
  };

  const handleGoToRegister = () => {
    navigate('/register', {
      state: { from: 'qr', salonId: salon?.id, redirectTo: '/services' }
    });
  };

  // لودینگ
  if (authLoading || loadingData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // خطا
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>خطا</h2>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.btnSecondary} onClick={() => navigate('/')}>
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  // سالن پیدا شد ولی لاگین نیست → نمایش کارت سالن + دکمه‌ها
  if (salon && !isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {/* لوگو سالن */}
          {salon.logo_url ? (
            <img src={salon.logo_url} alt={salon.name} style={styles.logo} />
          ) : (
            <div style={styles.logoPlaceholder}>✂️</div>
          )}

          <h2 style={styles.salonName}>{salon.name}</h2>

          {salon.city && (
            <p style={styles.salonMeta}>📍 {salon.city}</p>
          )}
          {salon.phone && (
            <p style={styles.salonMeta}>📱 {salon.phone}</p>
          )}

          <div style={styles.divider} />

          <p style={styles.prompt}>
            برای رزرو نوبت در این آرایشگاه، ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.
          </p>

          <div style={styles.btnGroup}>
            <button style={styles.btnPrimary} onClick={handleGoToLogin}>
              ورود به حساب
            </button>
            <button style={styles.btnOutline} onClick={handleGoToRegister}>
              ثبت‌نام
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    padding: '1rem',
    direction: 'rtl',
  },
  card: {
    background: 'var(--card)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    maxWidth: '380px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logo: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #ede9ff',
    marginBottom: '0.5rem',
  },
  logoPlaceholder: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  salonName: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: "var(--text-primary)",
    margin: 0,
  },
  salonMeta: {
    fontSize: '0.9rem',
    color: "var(--text-secondary)",
    margin: 0,
  },
  divider: {
    width: '100%',
    height: '1px',
    background: 'var(--card-hover)',
    margin: '0.5rem 0',
  },
  prompt: {
    fontSize: '0.9rem',
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    margin: 0,
  },
  btnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    marginTop: '0.5rem',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnOutline: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '12px',
    border: '2px solid var(--primary)',
    background: 'var(--card)',
    color: 'var(--primary)',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    background: 'var(--card-hover)',
    color: "var(--text-secondary)",
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid var(--surface-muted)',
    borderTop: '4px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '1rem',
  },
  loadingText: {
    color: "var(--text-secondary)",
    fontSize: '0.95rem',
  },
  errorIcon: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  errorTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
  },
  errorText: {
    color: "var(--text-secondary)",
    fontSize: '0.9rem',
  },
};

export default QRScanner;