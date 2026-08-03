import { AnimatePresence, motion } from 'framer-motion';

// Generic confirm modal, used for the "delete device" flow. Renders nothing
// when `open` is false so it can just be dropped at the bottom of any page.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', busy, error, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={busy ? undefined : onCancel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,27,34,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="dw-card"
            style={{ width: 380, maxWidth: 'calc(100vw - 40px)', padding: 26 }}
          >
            <h3 className="heading" style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>
              {title}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: error ? 10 : 22 }}>
              {message}
            </p>
            {error && (
              <p style={{ fontSize: 13, color: 'var(--empty)', marginBottom: 16 }}>{error}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="dw-btn" onClick={onCancel} disabled={busy}>
                Cancel
              </button>
              <button
                className="dw-btn"
                onClick={onConfirm}
                disabled={busy}
                style={{ background: 'var(--empty)', color: '#fff', border: 'none' }}
              >
                {busy ? 'Deleting…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
