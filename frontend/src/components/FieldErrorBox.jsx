import { motion } from 'framer-motion';
import '../styles/FieldError.css';

export const FieldErrorBox = ({ message }) => {
  if (!message) return null;
  
  return (
    <motion.div
      className="field-error-box"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <div className="field-error-icon">!</div>
      <div className="field-error-text">{message}</div>
    </motion.div>
  );
};

export const FieldError = ({ msg }) => {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        color: '#dc2626',
        fontSize: '0.81rem',
        marginTop: '0.4rem',
        marginBottom: 0,
        fontWeight: 500,
      }}
    >
      {msg}
    </motion.p>
  );
};
