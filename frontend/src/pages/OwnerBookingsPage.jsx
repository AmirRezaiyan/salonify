import { useAuth } from '../context/AuthContext';
import OwnerBookings from '../components/OwnerBookings';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Building2, MapPin, Phone, Sparkles, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';

export default function OwnerBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const tenantId = user?.salon?.id || localStorage.getItem('salon_id');

  if (authLoading) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        direction: 'rtl'
      }}
    >
      {/* هدر با گرادیانت مشابه Hero Section هوم */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          padding: '3rem 1.5rem',
          overflow: 'hidden'
        }}
      >
        {/* المان‌های تزئینی */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '300px',
          height: '300px',
          background: 'var(--surface-glass)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '250px',
          height: '250px',
          background: 'var(--surface-glass-muted)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.div
              initial={{ scale: 0.9, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
              }}
            >
              <Calendar size={32} color="#FFFFFF" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  color: 'white',
                  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                  fontWeight: 800,
                  margin: 0,
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                مدیریت رزروها
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  margin: '4px 0 0 0'
                }}
              >
                مشاهده و مدیریت رزروهای سالن
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              onClick={() => window.location.href = '/admin'}
              variant="outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '50px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <ArrowRight size={18} />
              بازگشت به پنل
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '3rem 1.5rem'
      }}>
        {/* کارت اطلاعات سالن با طراحی مدرن */}
        {user?.salon && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.01 }}
            style={{
              background: 'var(--card)',
              borderRadius: '24px',
              padding: '2rem',
              marginBottom: '2.5rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: "1px solid var(--border)",
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* نوار گرادیانت بالا */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
            }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)'
              }}>
                <Sparkles size={24} />
              </div>
              <h2 style={{
                color: "var(--text-primary)",
                fontSize: '1.4rem',
                fontWeight: 700,
                margin: 0
              }}>
                اطلاعات سالن
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <InfoItem
                icon={<Building2 size={20} />}
                label="نام سالن"
                value={user.salon.name}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
              <InfoItem
                icon={<MapPin size={20} />}
                label="شهر"
                value={user.salon.city || '—'}
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              />
              <InfoItem
                icon={<Phone size={20} />}
                label="تلفن"
                value={user.salon.phone || '—'}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              />
            </div>
          </motion.div>
        )}

        {/* بخش رزروها با کارت مدرن */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            background: 'var(--card)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            border: "1px solid var(--border)",
            position: 'relative'
          }}
        >
          {/* نوار گرادیانت بالا */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 6px 16px rgba(240, 147, 251, 0.3)'
            }}>
              <Clock size={24} />
            </div>
            <h2 style={{
              color: "var(--text-primary)",
              fontSize: '1.4rem',
              fontWeight: 700,
              margin: 0
            }}>
              لیست رزروها
            </h2>
          </div>

          {/* کامپوننت OwnerBookings */}
          <OwnerBookings tenantId={tenantId} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// کامپوننت آیتم اطلاعات با استایل هماهنگ
function InfoItem({ icon, label, value, gradient }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '1rem',
        background: 'var(--background-secondary)',
        borderRadius: '16px',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '0.85rem',
          color: "var(--text-secondary)",
          marginBottom: '4px',
          fontWeight: 500
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: "var(--text-primary)"
        }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}