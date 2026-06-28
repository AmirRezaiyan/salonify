import { motion } from 'framer-motion';
import '../styles/Alert.css';

export const Alert = ({ type = 'info', message, onClose }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const icon = icons[type] || icons.info;

  return (
    <motion.div
      className={`alert alert-${type}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="alert-message">
        <span className="alert-icon">{icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="alert-close" title="بستن">
          ×
        </button>
      )}
    </motion.div>
  );
};
