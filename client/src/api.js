const BASE = '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getDevices({ search = '', status = 'all', page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams({ search, status, page, pageSize });
  return request(`/devices?${params.toString()}`);
}

export function getDeviceSummaryCounts() {
  return request('/devices/summary');
}

export function getDevice(id) {
  return request(`/devices/${encodeURIComponent(id)}`);
}

// Permanently deletes a device and its full status history.
export function deleteDevice(id) {
  return request(`/devices/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Subscribes to the live SSE feed. `onUpdate` fires on status changes,
// `onDelete` fires when a device is removed (from any client). Returns an
// unsubscribe function.
export function subscribeToDeviceUpdates(onUpdate, onDelete) {
  const source = new EventSource(`${BASE}/stream`);
  source.addEventListener('device-update', (evt) => {
    try {
      onUpdate(JSON.parse(evt.data));
    } catch (err) {
      // ignore malformed events
    }
  });
  if (onDelete) {
    source.addEventListener('device-deleted', (evt) => {
      try {
        onDelete(JSON.parse(evt.data));
      } catch (err) {
        // ignore malformed events
      }
    });
  }
  return () => source.close();
}
