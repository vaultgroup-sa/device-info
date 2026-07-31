import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDevice } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatRelative, formatAbsolute, formatHistoryLabel } from '../utils/time.js';

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getDevice(id);
      setDevice(data);
      setNow(Date.now());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [load]);

  if (error) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 56px' }}>
        <Link to="/devices" style={{ fontWeight: 600 }}>← Back to All Devices</Link>
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>Device not found.</div>
      </main>
    );
  }

  if (!device) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 56px' }}>
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
      </main>
    );
  }

  const isFull = device.status === 1;

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 56px 90px' }}>
      <Link to="/devices" style={{ fontWeight: 600, fontSize: 14 }}>← Back to All Devices</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '18px 0 28px', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>{device.id}</div>
          <h1 className="heading" style={{ fontSize: 34, fontWeight: 700 }}>Box {device.id}</h1>
        </div>
        <button className="dw-btn" onClick={load} disabled={refreshing}>
          {refreshing ? '⟳ Refreshing…' : '⟳ Fetch latest'}
        </button>
      </div>

      <div
        className="dw-card"
        style={{
          padding: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 30,
          border: `1px solid ${isFull ? 'rgba(34,192,125,0.25)' : 'rgba(244,87,133,0.2)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div
            animate={isFull ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 1.8, repeat: isFull ? Infinity : 0, ease: 'easeInOut' }}
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: isFull ? 'var(--full-bg)' : 'var(--empty-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: isFull ? 'var(--full)' : 'var(--empty)' }} />
          </motion.div>
          <div>
            <div style={{ marginBottom: 6 }}><StatusBadge status={device.status} /></div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
              Updated <strong style={{ color: 'var(--ink)' }}>{formatRelative(device.lastUpdated, now)}</strong>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>REGISTERED</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{formatAbsolute(device.registeredAt)}</div>
        </div>
      </div>

      <h2 className="heading" style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Status History</h2>

      <div className="dw-card" style={{ padding: '6px 0' }}>
        {device.history.map((entry, i) => {
          const entryIsFull = entry.status === 1;
          return (
            <motion.div
              key={entry.at}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.02 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 24px',
                borderTop: i === 0 ? 'none' : '1px solid #f1f0f5',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: entryIsFull ? 'var(--full)' : 'var(--empty)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <StatusBadge status={entry.status} />
              </div>
              <div style={{ fontSize: 14, color: '#4a4756', minWidth: 160, textAlign: 'right' }}>
                {formatHistoryLabel(entry.at, now)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', minWidth: 170, textAlign: 'right' }}>
                {formatAbsolute(entry.at)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
