import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDevices, deleteDevice } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import TrashButton from '../components/TrashButton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { formatRelative, formatAbsolute } from '../utils/time.js';

const PAGE_SIZE = 10;

export default function DeviceList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ devices: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDevices({ search, status, page, pageSize: PAGE_SIZE });
      setResult(data);
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Light polling keeps the list fresh without requiring a manual refresh,
  // matching the "asynchronous update" requirement for this page too.
  useEffect(() => {
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [load]);

  const onSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const onStatusFilter = (e) => { setStatus(e.target.value); setPage(1); };
  const onClearFilters = () => { setSearch(''); setStatus('all'); setPage(1); };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteDevice(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete device');
    } finally {
      setDeleteBusy(false);
    }
  };

  const { devices, total, totalPages } = result;
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <main style={{ maxWidth: 1260, margin: '0 auto', padding: '24px 56px 90px' }}>
      <h1 className="heading" style={{ fontSize: 38, fontWeight: 700, marginBottom: 28 }}>All Devices</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px auto', gap: 14, alignItems: 'end', marginBottom: 26 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 7 }}>
            Search
          </label>
          <input className="dw-input" type="text" placeholder="Device ID" value={search} onChange={onSearch} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 7 }}>
            Status
          </label>
          <select className="dw-input" value={status} onChange={onStatusFilter}>
            <option value="all">All</option>
            <option value="1">Full</option>
            <option value="0">Empty</option>
          </select>
        </div>
        <button className="dw-btn" onClick={onClearFilters}>Clear</button>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 14 }}>
        {total} device{total === 1 ? '' : 's'} found{loading ? ' · refreshing…' : ''}
      </div>

      <div className="dw-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.4fr 1.4fr 1fr 40px', padding: '16px 24px', fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>
          <div>Device</div><div>Status</div><div>Last Updated</div><div>Registered</div><div></div><div></div>
        </div>
        {devices.map((d) => (
          <div
            key={d.id}
            className="dw-row"
            style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.4fr 1.4fr 1fr 40px', padding: '16px 24px', borderTop: '1px solid #f1f0f5', alignItems: 'center' }}
          >
            <div style={{ fontWeight: 700, fontSize: 14.5, color: d.status === 1 ? 'var(--full)' : 'var(--empty)' }}>
              Box {d.id}
            </div>
            <div><StatusBadge status={d.status} /></div>
            <div style={{ fontSize: 14, color: '#4a4756' }}>{formatRelative(d.lastUpdated, now)}</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>{formatAbsolute(d.registeredAt)}</div>
            <div style={{ textAlign: 'right' }}>
              <Link to={`/devices/${d.id}`} style={{ fontWeight: 600 }}>View History →</Link>
            </div>
            <div style={{ textAlign: 'right' }}>
              <TrashButton onClick={() => setPendingDelete(d)} />
            </div>
          </div>
        ))}
      </div>

      {devices.length === 0 && !loading && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
          No devices match these filters.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Page {page} of {totalPages}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="dw-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={isFirstPage}>← Prev</button>
          <button className="dw-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={isLastPage}>Next →</button>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete Box ${pendingDelete?.id ?? ''}?`}
        message="This permanently removes the device and its entire status history. This can't be undone."
        busy={deleteBusy}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setPendingDelete(null); setDeleteError(null); }}
      />
    </main>
  );
}
