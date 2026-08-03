import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import TrashButton from './TrashButton.jsx';
import { formatRelative, formatAbsolute } from '../utils/time.js';

export default function DeviceCard({ device, now, justChanged, onDeleteClick }) {
  const isFull = device.status === 1;
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!justChanged) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1200);
    return () => clearTimeout(t);
  }, [justChanged, device.lastUpdated]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="dw-card"
      style={{
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        border: `1px solid ${isFull ? 'rgba(34,192,125,0.25)' : 'rgba(244,87,133,0.2)'}`,
        animation: pulse ? 'dw-pulse-ring 1s ease-out' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
            {device.id}
          </div>
          <div className="heading" style={{ fontSize: 19, fontWeight: 700 }}>
            Box {device.id}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={device.status}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25 }}
            >
              <StatusBadge status={device.status} />
            </motion.div>
          </AnimatePresence>
          {onDeleteClick && (
            <TrashButton onClick={() => onDeleteClick(device)} />
          )}
        </div>
      </div>

      <div
        style={{
          height: 64,
          borderRadius: 12,
          background: isFull
            ? 'linear-gradient(135deg, #e8f8f0, #f3fdf8)'
            : 'linear-gradient(135deg, #fdeaef, #fef4f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={isFull ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: isFull ? Infinity : 0, ease: 'easeInOut' }}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isFull ? 'var(--full)' : 'var(--empty)',
            boxShadow: isFull ? '0 0 0 6px rgba(34,192,125,0.15)' : '0 0 0 6px rgba(244,87,133,0.12)',
          }}
        />
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
        Updated <strong style={{ color: 'var(--ink)' }}>{formatRelative(device.lastUpdated, now)}</strong>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
        Registered {formatAbsolute(device.registeredAt)}
      </div>

      <Link
        to={`/devices/${device.id}`}
        className="dw-btn"
        style={{ textAlign: 'center', marginTop: 4 }}
      >
        View History →
      </Link>
    </motion.div>
  );
}
