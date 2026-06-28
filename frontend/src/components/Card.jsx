import { motion } from 'framer-motion';
import '../styles/Card.css';

export const Card = ({ children, onClick, className = '' }) => {
  return (
    <motion.div
      className={`card ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
    >
      {children}
    </motion.div>
  );
};
