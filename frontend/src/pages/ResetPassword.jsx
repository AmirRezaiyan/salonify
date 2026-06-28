import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { FieldErrorBox } from '../components/FieldErrorBox';
import { Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ password: '', confirmPassword: '', general: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const API_BASE = import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_URL || 'http://localhost:8000';

  const isLinkValid = useMemo(() => Boolean(uid && token), [uid, token]);

  useEffect(() => {
    if (!isLinkValid) {
      setErrors(prev => ({ ...prev, general: 'لینک بازیابی نامعتبر است.' }));
    }
  }, [isLinkValid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = { password: '', confirmPassword: '', general: '' };
    let hasError = false;

    if (!formData.password) {
      newErrors.password = 'رمز عبور جدید را وارد کنید';
      hasError = true;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور را وارد کنید';
      hasError = true;
    }
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمزهای عبور با هم مطابقت ندارند';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({ password: '', confirmPassword: '', general: '' });
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/accounts/password-reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          token,
          password: formData.password,
          password_confirm: formData.confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccessMessage(data.message || 'رمز عبور با موفقیت تغییر کرد.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1600);
      } else {
        setErrors({
          password: data.password || '',
          confirmPassword: data.password_confirm || '',
          general: data.detail || data.message || data.error || 'تغییر رمز عبور ناموفق بود.',
        });
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'خطای شبکه. لطفاً دوباره تلاش کنید.' }));
    } finally {
      setLoading(false);
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
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        position: 'fixed',
        inset: 0,
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
          <div style={{
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
          }}>
            <LockKeyhole size={28} color="white" />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
            fontWeight: 800,
            color: 'white',
            margin: '0 0 0.4rem 0',
            textShadow: '0 2px 10px rgba(0,0,0,0.15)'
          }}>
            تعیین رمز عبور جدید
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            fontSize: '0.95rem'
          }}>
            رمز عبور تازه را برای حساب خود انتخاب کنید
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

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '1rem' }}
          >
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              fontSize: '0.95rem',
              lineHeight: 1.8
            }}>
              {successMessage}
              <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#047857' }}>
                در حال انتقال به صفحه ورود...
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              رمز عبور جدید
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="رمز عبور جدید"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={errors.password ? inputError : inputBase}
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
                  color: '#94a3b8'
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <FieldErrorBox message={errors.password} />}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              تکرار رمز عبور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="تکرار رمز عبور جدید"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={errors.confirmPassword ? inputError : inputBase}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
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
                  color: '#94a3b8'
                }}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'مخفی کردن تکرار رمز' : 'نمایش تکرار رمز'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <FieldErrorBox message={errors.confirmPassword} />}
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!isLinkValid}
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
            {loading ? 'در حال ذخیره...' : (
              <>
                <Sparkles size={18} />
                تغییر رمز عبور
              </>
            )}
          </Button>
        </form>

        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#64748b'
        }}>
          <Link to="/login" style={{ color: '#667eea', fontWeight: 700, textDecoration: 'none' }}>
            بازگشت به صفحه ورود
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
