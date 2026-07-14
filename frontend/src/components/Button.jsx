import { motion } from 'framer-motion';
import '../styles/Button.css';

export const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  loading = false,
  style = {},
  className = ''
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`.trim()}
      whileHover={{ scale: loading ? 1 : 1.05 }}
      whileTap={{ scale: loading ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      style={{
        ...style,
        direction: 'ltr',
        textAlign: 'left',
        justifyContent: 'center',
      }}
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
          <motion.div
            style={{
              width: '18px',
              height: '18px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>Loading...</span>
        </div>
      ) : children}
    </motion.button>
  );
};
