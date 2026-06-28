import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { FieldErrorBox } from '../components/FieldErrorBox';
import {
  LogIn,
  User,
  Sparkles,
  Scissors,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({ username: '', password: '', general: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_URL || 'http://localhost:8000';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    }
    if (resetMessage || resetError) {
      setResetMessage('');
      setResetError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = { username: '', password: '', general: '' };
    let hasError = false;

    if (!formData.username) {
      newErrors.username = 'لطفاً نام کاربری را وارد کنید';
      hasError = true;
    }
    if (!formData.password) {
      newErrors.password = 'لطفاً رمز عبور را وارد کنید';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({ username: '', password: '', general: '' });

    const result = await login(formData.username, formData.password);

    if (result.success) {
      const userRole = result.user?.role || 'customer';
      // چک کردن redirectTo از state یا localStorage (برای QR code flow)
      const redirectTo = location.state?.redirectTo || localStorage.getItem('qr_redirect_after_auth');

      setTimeout(() => {
        if (userRole === 'owner' || userRole === 'staff') {
          navigate('/admin');
        } else if (redirectTo) {
          localStorage.removeItem('qr_redirect_after_auth');
          navigate(redirectTo);
        } else {
          navigate('/');
        }
      }, 500);
    } else {
      const errMsg = result.error || '';

      if (result.fieldErrors && typeof result.fieldErrors === 'object') {
        setErrors(prev => ({
          ...prev,
          username: result.fieldErrors.username || '',
          password: result.fieldErrors.password || '',
          general: result.fieldErrors.general || '',
        }));
      } else {
        const lowerMsg = errMsg.toLowerCase();

        if (
          lowerMsg.includes('no active account') ||
          lowerMsg.includes('does not exist') ||
          lowerMsg.includes('وجود ندارد') ||
          lowerMsg.includes('not found') ||
          lowerMsg.includes('نام کاربری')
        ) {
          setErrors(prev => ({ ...prev, username: 'نام کاربری وجود ندارد یا اشتباه است', password: '' }));
        } else if (
          lowerMsg.includes('password') ||
          lowerMsg.includes('رمز') ||
          lowerMsg.includes('wrong') ||
          lowerMsg.includes('incorrect') ||
          lowerMsg.includes('نادرست')
        ) {
          setErrors(prev => ({ ...prev, password: 'رمز عبور نادرست است', username: '' }));
        } else if (lowerMsg.includes('invalid') || lowerMsg.includes('credentials')) {
          setErrors(prev => ({
            ...prev,
            username: 'نام کاربری وجود ندارد یا اشتباه است',
            password: 'رمز عبور نادرست است',
          }));
        } else if (lowerMsg.includes('disabled') || lowerMsg.includes('غیرفعال')) {
          setErrors(prev => ({ ...prev, general: 'این حساب کاربری غیرفعال شده است' }));
        } else if (lowerMsg.includes('network') || lowerMsg.includes('شبکه')) {
          setErrors(prev => ({ ...prev, general: 'خطای شبکه. لطفاً دوباره تلاش کنید' }));
        } else {
          setErrors(prev => ({ ...prev, general: errMsg || 'ورود ناموفق بود. لطفاً دوباره تلاش کنید.' }));
        }
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setResetError('');
    setResetMessage('');

    if (!formData.username.trim()) {
      setResetError('برای ارسال لینک بازیابی، ابتدا نام کاربری را وارد کنید.');
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/accounts/password-reset/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.username.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setResetMessage(data.message || 'اگر این حساب وجود داشته باشد، لینک بازیابی به ایمیل ثبت‌شده ارسال می‌شود.');
      } else {
        setResetError(
          data.detail ||
            data.message ||
            data.username ||
            data.error ||
            'ارسال لینک بازیابی ناموفق بود. دوباره تلاش کنید.'
        );
      }
    } catch (error) {
      setResetError('خطای شبکه. لطفاً دوباره تلاش کنید.');
    } finally {
      setResetLoading(false);
    }
  };

  const inputBase = {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '1rem',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const inputLtr = {
    ...inputBase,
    direction: 'ltr',
    textAlign: 'left'
  };

  const inputLtrError = {
    ...inputLtr,
    borderColor: '#f5576c',
    backgroundColor: '#fff5f7'
  };

  const inputRtl = {
    ...inputBase,
    direction: 'rtl',
    textAlign: 'right'
  };

  const inputRtlError = {
    ...inputRtl,
    borderColor: '#f5576c',
    backgroundColor: '#fff5f7'
  };

  const inputError = {
    ...inputBase,
    borderColor: '#f5576c',
    backgroundColor: '#fff5f7'
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = '#667eea';
    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.15)';
    e.target.style.backgroundColor = '#ffffff';
  };

  const handleBlur = (e, hasError) => {
    e.target.style.borderColor = hasError ? '#f5576c' : '#e2e8f0';
    e.target.style.boxShadow = 'none';
    e.target.style.backgroundColor = hasError ? '#fff5f7' : '#f8fafc';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
        direction: 'rtl',
        textAlign: 'right'
      }}
    >
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: 'linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.1) 100%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '350px',
          height: '350px',
          background: 'linear-gradient(135deg, rgba(118,75,162,0.1) 0%, rgba(102,126,234,0.08) 100%)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          width: '100%',
          maxWidth: '440px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.12)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '14px',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <Scissors size={30} color="white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
              fontWeight: 800,
              color: 'white',
              margin: '0 0 0.4rem 0',
              textShadow: '0 2px 10px rgba(0,0,0,0.15)'
            }}
          >
            ورود به حساب
          </motion.h1>
          <p style={{
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            fontSize: '0.95rem'
          }}>
            به نوبت‌دهی آنلاین آرایشگاه خوش آمدید
          </p>
        </div>

        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '1rem' }}
          >
            <Alert type="error" message={errors.general} onClose={() => setErrors(prev => ({ ...prev, general: '' }))} />
          </motion.div>
        )}

        {resetMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(15, 23, 42, 0.34)',
              display: 'grid',
              placeItems: 'center',
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                width: '100%',
                maxWidth: '430px',
                background: 'white',
                borderRadius: '22px',
                padding: '1.75rem 1.5rem',
                boxShadow: '0 28px 80px rgba(15, 23, 42, 0.18)',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                    لینک بازیابی ارسال شد
                  </p>
                  <p style={{ margin: '0.85rem 0 0 0', color: '#475569', lineHeight: 1.75 }}>
                    اگر این حساب وجود داشته باشد، لینک بازیابی به ایمیل ثبت‌شده ارسال می‌شود.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetMessage('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '1.4rem',
                    lineHeight: 1
                  }}
                  aria-label="بستن"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                onClick={() => setResetMessage('')}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  borderRadius: '12px',
                  border: 'none',
                  padding: '0.95rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                متوجه شدم
              </button>
            </motion.div>
          </motion.div>
        )}

        {resetError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '1rem' }}
          >
            <Alert type="error" message={resetError} onClose={() => setResetError('')} />
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              نام کاربری
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={errors.username ? inputLtrError : inputLtr}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.username)}
              />
              <User
                size={18}
                color={errors.username ? '#f5576c' : '#94a3b8'}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>
            {errors.username && <FieldErrorBox message={errors.username} />}
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              رمز عبور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  ...(errors.password ? inputLtrError : inputLtr),
                  paddingRight: '1rem',
                  paddingLeft: '3rem'
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  transition: 'color 0.2s',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                tabIndex={-1}
                aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <FieldErrorBox message={errors.password} />}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#667eea',
                fontWeight: 700,
                cursor: resetLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Mail size={16} />
              {resetLoading ? 'در حال ارسال...' : 'فراموشی رمز عبور'}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: '10px',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                'در حال ورود...'
              ) : (
                <>
                  <LogIn size={20} />
                  ورود به حساب
                </>
              )}
            </Button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            color: '#64748b',
            fontSize: '0.95rem'
          }}
        >
          حساب کاربری ندارید؟{' '}
          <Link
            to="/signup"
            style={{
              color: '#667eea',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#764ba2'}
            onMouseLeave={(e) => e.target.style.color = '#667eea'}
          >
            یک حساب بسازید
          </Link>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center'
          }}
        >
          <p style={{
            fontSize: '0.85rem',
            color: '#94a3b8',
            margin: '0 0 0.3rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}>
            <Sparkles size={14} color="#667eea" />
            ورود به پلتفرم نوبت‌دهی آنلاین
          </p>
          <p style={{
            fontSize: '0.75rem',
            color: '#cbd5e1',
            margin: 0
          }}>
            ورود سریع و امن به حساب کاربری
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}