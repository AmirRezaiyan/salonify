import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  Lock,
  Scissors,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  Store,
  MapPin
} from 'lucide-react';

// ─── استایل‌های مشترک ─────────────────────────────────────────────────────────
const COLORS = {
  primary: 'var(--primary)',
  primaryDark: 'var(--primary-dark)',
  danger: 'var(--danger)',
  text: 'var(--text-primary)',
  muted: 'var(--text-muted)',
  lightBg: 'var(--surface-muted)',
  border: 'var(--border)',
  errorBg: 'var(--danger-surface)'
};

const inputBase = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: '10px',
  fontSize: '0.95rem',
  color: COLORS.text,
  backgroundColor: COLORS.lightBg,
  transition: 'all 0.2s',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const inputLtr = {
  ...inputBase,
  direction: 'ltr',
  textAlign: 'left',
  paddingLeft: '2.75rem'
};

const inputRtl = {
  ...inputBase,
  direction: 'rtl',
  textAlign: 'right',
  paddingLeft: '2.75rem'
};

const inputLtrError = {
  ...inputLtr,
  borderColor: COLORS.danger,
  backgroundColor: COLORS.lightBg
};

const inputRtlError = {
  ...inputRtl,
  borderColor: COLORS.danger,
  backgroundColor: COLORS.lightBg
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: '0.9rem'
};

const iconStyle = (side = 'left') => ({
  position: 'absolute',
  [side]: '0.85rem',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none'
});

const textareaBase = {
  ...inputBase,
  minHeight: '110px',
  resize: 'vertical',
  lineHeight: 1.7,
  direction: 'rtl',
  textAlign: 'right'
};

const textareaErr = {
  ...textareaBase,
  borderColor: COLORS.danger,
  backgroundColor: COLORS.lightBg
};

// کاملاً inline — بدون هیچ کامپوننت خارجی
const FieldError = ({ msg }) => {
  if (!msg) return null;
  return (
    <p
      style={{
        color: '#ef4444',
        fontSize: '0.8rem',
        marginTop: '0.35rem',
        marginBottom: 0,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem'
      }}
    >
      ⚠ {msg}
    </p>
  );
};

const FormAlert = ({ msg }) => {
  if (!msg) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--danger-surface)',
        border: '1px solid #fecaca',
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        marginBottom: '1.5rem',
        color: '#dc2626',
        fontSize: '0.9rem',
        fontWeight: 500
      }}
    >
      ⚠ {msg}
    </div>
  );
};

// ─── کامپوننت اصلی ────────────────────────────────────────────────────────────
// ─── لیست شهرهای ایران ───────────────────────────────────────────────────────
const IRAN_CITIES = [
  { value: 'تهران', label: 'تهران' },
  { value: 'مشهد', label: 'مشهد' },
  { value: 'اصفهان', label: 'اصفهان' },
  { value: 'شیراز', label: 'شیراز' },
  { value: 'تبریز', label: 'تبریز' },
  { value: 'قم', label: 'قم' },
  { value: 'کاشان', label: 'کاشان' },
  { value: 'کرمانشاه', label: 'کرمانشاه' },
  { value: 'بندرعباس', label: 'بندرعباس' },
  { value: 'اهواز', label: 'اهواز' },
  { value: 'یزد', label: 'یزد' },
  { value: 'کرج', label: 'کرج' },
  { value: 'اراک', label: 'اراک' },
  { value: 'همدان', label: 'همدان' },
  { value: 'خرم آباد', label: 'خرم آباد' },
  { value: 'سنندج', label: 'سنندج' },
  { value: 'بجنورد', label: 'بجنورد' },
  { value: 'سبزوار', label: 'سبزوار' },
  { value: 'رشت', label: 'رشت' },
  { value: 'بابل', label: 'بابل' },
  { value: 'گرگان', label: 'گرگان' },
  { value: 'رامسر', label: 'رامسر' },
  { value: 'ساری', label: 'ساری' },
  { value: 'اردبیل', label: 'اردبیل' },
  { value: 'زنجان', label: 'زنجان' },
  { value: 'اردستان', label: 'اردستان' },
  { value: 'بوشهر', label: 'بوشهر' },
  { value: 'خوی', label: 'خوی' },
  { value: 'مهاباد', label: 'مهاباد' },
  { value: 'مریوان', label: 'مریوان' },
  { value: 'قائم‌شهر', label: 'قائم‌شهر' },
  { value: 'لاهیجان', label: 'لاهیجان' },
  { value: 'علی‌آباد', label: 'علی‌آباد' },
  { value: 'انزلی', label: 'انزلی' },
  { value: 'چالوس', label: 'چالوس' },
  { value: 'نوشهر', label: 'نوشهر' },
  { value: 'نیشابور', label: 'نیشابور' },
];

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    city: '',
    role: 'customer',
    gender: '',
    salon_name: '',
    salon_city: '',
    salon_phone: '',
    salon_gender: '',
    salon_address: '',
    services: []
  });

  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ─── هندلرها ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  const onFocus = (e, hasErr) => {
    e.target.style.borderColor = hasErr ? COLORS.danger : COLORS.primary;
    e.target.style.boxShadow = hasErr
      ? '0 0 0 3px rgba(239,68,68,0.12)'
      : '0 0 0 3px rgba(37,99,235,0.15)';
  };

  const onBlur = (e) => {
    e.target.style.border = '';
    e.target.style.boxShadow = '';
  };

  // ─── اعتبارسنجی ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};

    if (!formData.username?.trim()) e.username = 'نام کاربری الزامی است';
    else if (formData.username.length < 3) e.username = 'حداقل ۳ کاراکتر';
    else if (!/^[\x00-\x7F]+$/.test(formData.username)) e.username = 'فقط حروف و ارقام انگلیسی';

    if (!formData.email?.trim()) e.email = 'ایمیل الزامی است';
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) e.email = 'ایمیل معتبر نیست (مثال: user@example.com)';
    }

    if (!formData.first_name?.trim()) e.first_name = 'نام الزامی است';
    if (!formData.last_name?.trim()) e.last_name = 'نام خانوادگی الزامی است';

    if (!formData.phone_number?.trim()) e.phone_number = 'شماره تلفن الزامی است';
    else {
      const phoneDigits = formData.phone_number.replace(/\D/g, '');
      if (phoneDigits.length < 10) e.phone_number = 'شماره تلفن باید حداقل ۱۰ رقم باشد';
      else if (phoneDigits.length > 12) e.phone_number = 'شماره تلفن نمی‌تواند بیش‌تر از ۱۲ رقم باشد';
    }

    if (!formData.password) e.password = 'رمز عبور الزامی است';
    else if (formData.password.length < 6) e.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';

    if (!formData.password_confirm) e.password_confirm = 'تأیید رمز عبور الزامی است';
    else if (formData.password !== formData.password_confirm) e.password_confirm = 'رمزها مطابقت ندارند';

    if (formData.role === 'owner') {
      if (!formData.salon_name?.trim()) e.salon_name = 'نام سالن برای مالک الزامی است';
      if (!formData.salon_city?.trim()) e.salon_city = 'شهر سالن برای مالک الزامی است';
      if (!formData.salon_gender?.trim()) e.salon_gender = 'جنسیت سالن برای مالک الزامی است';
      if (!formData.salon_address?.trim()) e.salon_address = 'آدرس سالن برای مالک الزامی است';

      if (formData.salon_phone?.trim()) {
        const salonPhoneDigits = formData.salon_phone.replace(/\D/g, '');
        if (salonPhoneDigits.length < 10) e.salon_phone = 'شماره سالن معتبر نیست (حداقل ۱۰ رقم)';
        else if (salonPhoneDigits.length > 12) e.salon_phone = 'شماره سالن نمی‌تواند بیش‌تر از ۱۲ رقم باشد';
      }
    }

    // مشتریان باید شهر خود را انتخاب کنند
    if (formData.role === 'customer') {
      if (!formData.city?.trim()) e.city = 'شهر الزامی است';
    }

    return e;
  };

  // ─── ترجمه خطا ──────────────────────────────────────────────────────────────
  function toFarsiError(field, msg) {
    const m = String(msg).toLowerCase();
    if (m.includes('already exists') || m.includes('قبلاً ثبت شده') || m.includes('duplicate')) {
      if (field === 'email') return 'این ایمیل قبلاً ثبت شده است';
      if (field === 'phone_number') return 'این شماره تلفن قبلاً ثبت شده است';
      if (field === 'salon_phone') return 'این شماره تلفن سالن قبلاً ثبت شده است';
      if (field === 'username') return 'این نام کاربری قبلاً ثبت شده است';
      return 'این مقدار قبلاً ثبت شده است';
    }
    if (m.includes('too short') || m.includes('at least 8')) return 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    if (m.includes('too common') || m.includes('common')) return 'رمز عبور خیلی ساده است';
    if (m.includes('entirely numeric') || m.includes('numeric')) return 'رمز عبور نباید فقط عدد باشد';
    if (field === 'email' && (m.includes('invalid') || m.includes('enter a valid')))
      return 'فرمت ایمیل صحیح نیست (مثال: user@example.com)';
    if (field === 'phone_number' && m.includes('invalid'))
      return 'شماره تلفن معتبر نیست (حداقل ۱۰ رقم)';
    if (field === 'salon_phone' && m.includes('invalid'))
      return 'شماره تلفن سالن معتبر نیست (حداقل ۱۰ رقم)';
    if ((field === 'salon_name' || field === 'salon_city' || field === 'salon_gender' || field === 'salon_address') && m.includes('required'))
      return 'این فیلد الزامی است';
    return msg;
  }

  // ─── ارسال فرم ──────────────────────────────────────────────────────────────
  function handleSubmit(ev) {
    ev.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError('');
    setErrors({});

    const payload = {
      ...formData,
      city: formData.role === 'customer' ? formData.city : (formData.city || ''),
      salon_name: formData.role === 'owner' ? formData.salon_name : '',
      salon_city: formData.role === 'owner' ? formData.salon_city : '',
      salon_phone: formData.role === 'owner' ? formData.salon_phone : '',
      salon_gender: formData.role === 'owner' ? formData.salon_gender : '',
      salon_address: formData.role === 'owner' ? formData.salon_address : '',
      services: formData.role === 'owner' ? (formData.services || []) : []
    };

    register(payload)
      .then(function (result) {
        console.log('Register result:', result);

        if (result.success) {
          // پاس دادن redirectTo به صفحه لاگین تا بعد از ورود به مقصد درست بره
          const redirectTo = location.state?.redirectTo || localStorage.getItem('qr_redirect_after_auth');
          navigate('/login', { state: { username: formData.username, redirectTo: redirectTo || undefined } });
          return;
        }

        const src = result.errors;
        if (src && typeof src === 'object') {
          const msgs = {};
          Object.keys(src).forEach(function (key) {
            const val = src[key];
            const raw = Array.isArray(val) ? (val[0] || '') : String(val);
            msgs[key] = toFarsiError(key, raw);
          });

          if (Object.keys(msgs).length > 0) {
            setErrors(msgs);
            setError('لطفاً خطاهای مشخص‌شده را اصلاح کنید');
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }

        setError(result.error || 'ثبت نام ناموفق بود. دوباره تلاش کنید.');
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function () {
        setError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
        setLoading(false);
      });
  }

  // ─── رندر ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '2rem 1rem',
        boxSizing: 'border-box',
        direction: 'rtl',
        textAlign: 'right'
      }}
    >
      {/* پس‌زمینه تزئینی */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '400px',
            height: '400px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(59,130,246,0.05) 100%)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '350px',
            height: '350px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(37,99,235,0.04) 100%)',
            borderRadius: '50%',
            filter: 'blur(50px)'
          }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: 'var(--card)',
          borderRadius: '20px',
          padding: 'clamp(1.25rem, 4vw, 2.5rem)',
          width: '100%',
          maxWidth: '820px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(37,99,235,0.1)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* ── هدر ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            borderRadius: '14px',
            padding: '1.75rem 1.5rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: 'var(--surface-glass-strong)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--surface-glass-strong)'
            }}
          >
            <Scissors size={28} color="white" />
          </motion.div>
          <h1
            style={{
              fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
              fontWeight: 800,
              color: 'white',
              margin: '0 0 0.3rem 0',
              textShadow: '0 2px 10px rgba(0,0,0,0.15)'
            }}
          >
            ساخت حساب کاربری
          </h1>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.95rem' }}>
            اطلاعات خود را وارد کنید
          </p>
        </div>

        {/* ── خطای کلی ── */}
        <FormAlert msg={error} />

        {/* ── فرم ── */}
        <form onSubmit={handleSubmit} noValidate>

          {/* ───── انتخاب نقش ───── */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ ...labelStyle, marginBottom: '0.6rem' }}>نوع حساب</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem'
              }}
            >
              {[
                { value: 'customer', label: 'مشتری', icon: <User size={18} />, desc: 'رزرو نوبت آنلاین' },
                { value: 'owner', label: 'مالک سالن', icon: <Store size={18} />, desc: 'مدیریت سالن و نوبت‌ها' }
              ].map(({ value, label, icon, desc }) => {
                const active = formData.role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'role', value } })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: active ? `2px solid ${COLORS.primary}` : `1.5px solid ${COLORS.border}`,
                      backgroundColor: active ? 'rgba(37,99,235,0.06)' : 'var(--surface-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'right'
                    }}
                  >
                    <span style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: active
                        ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                        : 'var(--border)',
                      color: active ? 'white' : 'var(--text-muted)',
                      transition: 'all 0.2s'
                    }}>
                      {icon}
                    </span>
                    <span>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: active ? COLORS.primary : 'var(--text-primary)' }}>{label}</span>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: "var(--text-muted)", marginTop: '0.1rem' }}>{desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ───── بخش اطلاعات کاربری ───── */}
          <SectionTitle icon={<User size={18} />} title="اطلاعات شخصی" />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <label style={labelStyle}>نام کاربری</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="username"
                  placeholder="username"
                  value={formData.username}
                  onChange={handleChange}
                  style={errors.username ? inputLtrError : inputLtr}
                  onFocus={(e) => onFocus(e, !!errors.username)}
                  onBlur={onBlur}
                />
                <User size={16} color={errors.username ? COLORS.danger : '#94a3b8'} style={iconStyle('left')} />
              </div>
              <FieldError msg={errors.username} />
            </div>

            <div>
              <label style={labelStyle}>ایمیل</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={errors.email ? inputLtrError : inputLtr}
                  onFocus={(e) => onFocus(e, !!errors.email)}
                  onBlur={onBlur}
                />
                <Mail size={16} color={errors.email ? COLORS.danger : '#94a3b8'} style={iconStyle('left')} />
              </div>
              <FieldError msg={errors.email} />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <label style={labelStyle}>نام</label>
              <input
                type="text"
                name="first_name"
                placeholder="نام"
                value={formData.first_name}
                onChange={handleChange}
                style={errors.first_name ? inputRtlError : inputRtl}
                onFocus={(e) => onFocus(e, !!errors.first_name)}
                onBlur={onBlur}
              />
              <FieldError msg={errors.first_name} />
            </div>

            <div>
              <label style={labelStyle}>نام خانوادگی</label>
              <input
                type="text"
                name="last_name"
                placeholder="نام خانوادگی"
                value={formData.last_name}
                onChange={handleChange}
                style={errors.last_name ? inputRtlError : inputRtl}
                onFocus={(e) => onFocus(e, !!errors.last_name)}
                onBlur={onBlur}
              />
              <FieldError msg={errors.last_name} />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <label style={labelStyle}>شماره موبایل</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={formData.phone_number}
                  onChange={handleChange}
                  style={errors.phone_number ? inputRtlError : inputRtl}
                  onFocus={(e) => onFocus(e, !!errors.phone_number)}
                  onBlur={onBlur}
                />
                <Phone size={16} color={errors.phone_number ? COLORS.danger : '#94a3b8'} style={iconStyle('left')} />
              </div>
              <FieldError msg={errors.phone_number} />
            </div>

            <div>
              <label style={labelStyle}>جنسیت</label>
              <div style={{ position: 'relative' }}>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{
                    ...(errors.gender ? inputRtlError : inputRtl),
                    paddingRight: '2.5rem',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => onFocus(e, !!errors.gender)}
                  onBlur={onBlur}
                >
                  <option value="">انتخاب جنسیت</option>
                  <option value="male">مرد</option>
                  <option value="female">زن</option>
                </select>
                <ChevronDown size={16} color={errors.gender ? '#f5576c' : '#94a3b8'} style={iconStyle('right')} />
              </div>
              <FieldError msg={errors.gender} />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <CitySelect
              name="city"
              label="شهر"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
            />
          </div>

          {/* ───── اطلاعات سالن فقط برای مالک ───── */}
          {formData.role === 'owner' && (
            <>
              <SectionTitle icon={<Scissors size={18} />} title="اطلاعات سالن" />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <label style={labelStyle}>نام سالن</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="salon_name"
                      placeholder="نام سالن"
                      value={formData.salon_name}
                      onChange={handleChange}
                    style={errors.salon_name ? inputRtlError : inputRtl}
                      onFocus={(e) => onFocus(e, !!errors.salon_name)}
                      onBlur={onBlur}
                    />
                    <Store size={16} color={errors.salon_name ? '#f5576c' : '#94a3b8'} style={iconStyle('left')} />
                  </div>
                  <FieldError msg={errors.salon_name} />
                </div>

                <div>
                  <CitySelect
                    name="salon_city"
                    label="شهر سالن"
                    value={formData.salon_city}
                    onChange={handleChange}
                    error={errors.salon_city}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <label style={labelStyle}>شماره سالن</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      name="salon_phone"
                      placeholder="شماره تلفن سالن"
                      value={formData.salon_phone}
                      onChange={handleChange}
                    style={errors.salon_phone ? inputRtlError : inputRtl}
                      onFocus={(e) => onFocus(e, !!errors.salon_phone)}
                      onBlur={onBlur}
                    />
                    <Phone size={16} color={errors.salon_phone ? '#f5576c' : '#94a3b8'} style={iconStyle('left')} />
                  </div>
                  <FieldError msg={errors.salon_phone} />
                </div>

                <div>
                  <label style={labelStyle}>جنسیت سالن</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      name="salon_gender"
                      value={formData.salon_gender}
                      onChange={handleChange}
                      style={{
                        ...(errors.salon_gender ? inputRtlError : inputRtl),
                        paddingRight: '2.5rem',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => onFocus(e, !!errors.salon_gender)}
                      onBlur={onBlur}
                    >
                      <option value="">انتخاب کنید</option>
                      <option value="male">مردانه</option>
                      <option value="female">زنانه</option>
                    </select>
                    <ChevronDown size={16} color={errors.salon_gender ? '#f5576c' : '#94a3b8'} style={iconStyle('right')} />
                  </div>
                  <FieldError msg={errors.salon_gender} />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>آدرس سالن</label>
                <textarea
                  name="salon_address"
                  placeholder="آدرس کامل سالن"
                  value={formData.salon_address}
                  onChange={handleChange}
                  style={errors.salon_address ? textareaErr : textareaBase}
                  onFocus={(e) => onFocus(e, !!errors.salon_address)}
                  onBlur={onBlur}
                />
                <FieldError msg={errors.salon_address} />
              </div>
            </>
          )}

          {/* ───── بخش رمز عبور ───── */}
          <SectionTitle icon={<Lock size={18} />} title="رمز عبور" />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <div>
              <label style={labelStyle}>رمز عبور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  style={errors.password ? inputLtrError : inputLtr}
                  onFocus={(e) => onFocus(e, !!errors.password)}
                  onBlur={onBlur}
                />
                <EyeToggle show={showPass} onToggle={() => setShowPass((p) => !p)} hasErr={!!errors.password} />
              </div>
              <FieldError msg={errors.password} />
            </div>

            <div>
              <label style={labelStyle}>تأیید رمز عبور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassConfirm ? 'text' : 'password'}
                  name="password_confirm"
                  placeholder="Confirm password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  style={errors.password_confirm ? inputLtrError : inputLtr}
                  onFocus={(e) => onFocus(e, !!errors.password_confirm)}
                  onBlur={onBlur}
                />
                <EyeToggle
                  show={showPassConfirm}
                  onToggle={() => setShowPassConfirm((p) => !p)}
                  hasErr={!!errors.password_confirm}
                />
              </div>
              <FieldError msg={errors.password_confirm} />
            </div>
          </div>

          {/* ───── دکمه ثبت نام ───── */}
          <div style={{ textAlign: 'center' }}>
            <Button
              type="submit"
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                color: 'white',
                padding: '0.9rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: '10px',
                boxShadow: '0 6px 20px rgba(102,126,234,0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '200px',
                justifyContent: 'center'
              }}
            >
              {loading ? 'در حال ساخت حساب...' : (<><UserPlus size={20} /> ساخت حساب کاربری</>)}
            </Button>
          </div>
        </form>

        {/* ── فوتر ── */}
        <p style={{ textAlign: 'center', marginTop: '1.75rem', color: "var(--text-secondary)", fontSize: '0.95rem' }}>
          حساب کاربری دارید؟{' '}
          <Link
            to="/login"
            style={{ color: COLORS.primary, fontWeight: 700, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.target.style.color = COLORS.primaryDark)}
            onMouseLeave={(e) => (e.target.style.color = COLORS.primary)}
          >
            وارد شوید
          </Link>
        </p>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.85rem',
              color: "var(--text-muted)",
              margin: '0 0 0.3rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <Sparkles size={14} color="#667eea" />
            شروع استفاده از پلتفرم نوبت‌دهی آنلاین
          </p>
          <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0 }}>ثبت نام سریع و رایگان</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── کامپوننت‌های کمکی ────────────────────────────────────────────────────────

function CitySelect({ name, label, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = IRAN_CITIES.filter(c => c.label.includes(search) || c.value.includes(search));
  const selected = IRAN_CITIES.find(c => c.value === value);

  const pick = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <label style={labelStyle}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: error ? `1.5px solid ${COLORS.danger}` : `1.5px solid ${COLORS.border}`,
          borderRadius: '10px',
          fontSize: '0.95rem',
          color: selected ? COLORS.text : COLORS.muted,
          backgroundColor: COLORS.lightBg,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          direction: 'rtl',
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={15} color={error ? COLORS.danger : COLORS.muted} />
          {selected ? selected.label : 'انتخاب شهر'}
        </span>
        <ChevronDown size={15} color={error ? COLORS.danger : COLORS.muted} />
      </button>
      <FieldError msg={error} />

      {open && (
        <div
          onClick={() => { setOpen(false); setSearch(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--card)',
              borderRadius: '20px 20px 0 0',
              padding: '1rem',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              direction: 'rtl'
            }}
          >
            {/* handle */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--surface-muted)', margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: COLORS.text, margin: '0 0 0.75rem', textAlign: 'center' }}>انتخاب شهر</p>

            {/* search */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input
                autoFocus
                type="text"
                placeholder="جستجو..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '0.6rem 0.9rem',
                  border: `1.5px solid ${COLORS.border}`,
                  borderRadius: '8px', fontSize: '0.9rem',
                  outline: 'none', boxSizing: 'border-box',
                  direction: 'rtl', fontFamily: 'inherit',
                  color: COLORS.text, backgroundColor: COLORS.lightBg
                }}
              />
            </div>

            {/* list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 && (
                <p style={{ color: "var(--text-muted)", textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>شهری یافت نشد</p>
              )}
              {filtered.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => pick(c.value)}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    border: 'none', borderRadius: '8px',
                    background: value === c.value ? 'rgba(37,99,235,0.1)' : 'transparent',
                    color: value === c.value ? COLORS.primary : COLORS.text,
                    fontWeight: value === c.value ? 700 : 400,
                    fontSize: '0.95rem', cursor: 'pointer',
                    textAlign: 'right', fontFamily: 'inherit',
                    marginBottom: '2px', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  {c.label}
                  {value === c.value && <span style={{ color: COLORS.primary, fontSize: '1.1rem' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: `2px solid rgba(37,99,235,0.15)`
      }}
    >
      <span style={{ color: COLORS.primary }}>{icon}</span>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
    </div>
  );
}

function EyeToggle({ show, onToggle, hasErr }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={-1}
      aria-label={show ? 'مخفی کردن رمز' : 'نمایش رمز'}
      style={{
        position: 'absolute',
        left: '0.65rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.2rem',
        display: 'flex',
        alignItems: 'center',
        color: hovered ? COLORS.primary : hasErr ? COLORS.danger : COLORS.muted,
        transition: 'color 0.2s'
      }}
    >
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}