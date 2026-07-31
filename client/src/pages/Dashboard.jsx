import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceCard from '../components/DeviceCard.jsx';
import { getDevices, getDeviceSummaryCounts, subscribeToDeviceUpdates } from '../api.js';

const TICK_MS = 1000;
const RECENT_MS = 1200;

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [counts, setCounts] = useState({ total: 0, full: 0, empty: 0 });
  const [now, setNow] = useState(Date.now());
  const [recentlyChanged, setRecentlyChanged] = useState({});
  const [connected, setConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const recentTimers = useRef({});

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [list, summary] = await Promise.all([
        getDevices({ pageSize: 100 }),
        getDeviceSummaryCounts(),
      ]);
      setDevices(list.devices);
      setCounts(summary);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribeToDeviceUpdates((update) => {
      setConnected(true);
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.id === update.id);
        if (idx === -1) return [update, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...update };
        return next;
      });
      setRecentlyChanged((prev) => ({ ...prev, [update.id]: true }));
      clearTimeout(recentTimers.current[update.id]);
      recentTimers.current[update.id] = setTimeout(() => {
        setRecentlyChanged((prev) => {
          const next = { ...prev };
          delete next[update.id];
          return next;
        });
      }, RECENT_MS);
      // Counts can drift from optimistic math above; just resync from the server.
      getDeviceSummaryCounts().then(setCounts).catch(() => {});
    });
    const timeout = setTimeout(() => setConnected(true), 500);
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const sorted = [...devices].sort((a, b) => b.lastUpdated - a.lastUpdated);

  return (
    <main style={{ maxWidth: 1260, margin: '0 auto', padding: '24px 56px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="heading" style={{ fontSize: 38, fontWeight: 700 }}>Live Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13.5, color: 'var(--muted)' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: connected ? 'var(--full)' : '#d8d5e2',
                display: 'inline-block',
              }}
            />
            {connected ? 'Live — updates stream in automatically' : 'Connecting…'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SummaryPill label="Devices" value={counts.total} />
          <SummaryPill label="Full" value={counts.full} tone="full" />
          <SummaryPill label="Empty" value={counts.empty} tone="empty" />
          <button className="dw-btn dw-btn-primary" onClick={load} disabled={refreshing}>
            {refreshing ? <span className="dw-spin" style={{ display: 'inline-block' }}>⟳</span> : '⟳'} Fetch latest
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--muted)' }}>
          No devices yet — waiting for the first ping.
        </div>
      ) : (
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 18,
          }}
        >
          <AnimatePresence>
            {sorted.map((d) => (
              <DeviceCard key={d.id} device={d} now={now} justChanged={!!recentlyChanged[d.id]} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}

function SummaryPill({ label, value, tone }) {
  const color = tone === 'full' ? 'var(--full)' : tone === 'empty' ? 'var(--empty)' : 'var(--ink)';
  return (
    <div className="dw-card" style={{ padding: '10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 74 }}>
      <span className="heading" style={{ fontSize: 20, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
    </div>
  );
}
