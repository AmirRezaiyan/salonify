import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Loading.css';

const MESSAGES = [
  'در حال آماده‌سازی...',
  'یک لحظه صبر کنید...',
  'به زودی آماده می‌شود...',
];

export const Loading = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="loading-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-content">
        <div className="barber-pole-scene" role="img" aria-label="در حال بارگذاری">
          <div className="barber-pole-cap barber-pole-cap-top" />
          <div className="barber-pole-shaft">
            <div className="barber-pole-stripes" />
            <div className="barber-pole-glass" />
          </div>
          <div className="barber-pole-cap barber-pole-cap-bottom" />
          <div className="barber-pole-glow" />
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            className="loading-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const Skeleton = () => {
  return (
    <motion.div
      className="skeleton"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
};