const BASE = '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
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

// Subscribes to the live SSE feed. Returns an unsubscribe function.
export function subscribeToDeviceUpdates(onUpdate) {
  const source = new EventSource(`${BASE}/stream`);
  source.addEventListener('device-update', (evt) => {
    try {
      onUpdate(JSON.parse(evt.data));
    } catch (err) {
      // ignore malformed events
    }
  });
  return () => source.close();
}
