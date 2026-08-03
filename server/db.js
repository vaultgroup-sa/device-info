// File-based "database" for the POC.
//
// Design notes:
// - `state` is the single in-memory source of truth. All reads/writes to it
//   happen synchronously (no `await` in between reading and updating), so
//   concurrent requests for the same deviceId can't interleave and corrupt
//   the dedup decision even though Node processes them on one thread.
// - Disk writes are debounced/coalesced: bursts of rapid device pings (every
//   1-2s, lots of duplicates) only trigger a flush when the in-memory state
//   actually changes, and multiple changes that land while a flush is in
//   flight get coalesced into the next flush instead of piling up writes.
// - Writes are atomic (write to a .tmp file, then rename) so a crash or
//   concurrent read never sees a half-written JSON file.

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'devices.json');
const MAX_HISTORY_PER_DEVICE = 1000;

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

function loadSync() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.devices) return parsed;
  } catch (err) {
    // Missing file or corrupt JSON -> start fresh. Fine for a POC.
  }
  return { devices: {} };
}

let state = loadSync();
let writeChain = Promise.resolve();
let pendingWrite = false;

function scheduleWrite() {
  if (pendingWrite) return;
  pendingWrite = true;
  writeChain = writeChain.then(flush).catch((err) => {
    console.error('[db] failed to persist devices.json:', err);
  });
}

async function flush() {
  pendingWrite = false;
  const snapshot = JSON.stringify(state, null, 2);
  const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.writeFile(tmpFile, snapshot, 'utf-8');
  await fs.promises.rename(tmpFile, DATA_FILE);
}

/** Force a flush now and wait for it (used by tests / graceful shutdown). */
async function flushNow() {
  pendingWrite = true;
  await (writeChain = writeChain.then(flush));
}

function normalizeStatus(rawStatus) {
  // Spec: status === 1 -> "full", anything else -> "empty".
  return rawStatus === 1 || rawStatus === '1' ? 1 : 0;
}

/**
 * Records an incoming device ping. Only persists a new history entry when
 * the status actually changed since the last known status for that device
 * (the dedup mechanism) -- duplicate pings are acknowledged but discarded.
 */
function recordPing(deviceId, rawStatus) {
  const status = normalizeStatus(rawStatus);
  const now = Date.now();
  let device = state.devices[deviceId];
  let changed = false;
  let created = false;

  if (!device) {
    device = {
      id: deviceId,
      registeredAt: now,
      status,
      history: [{ status, at: now }],
    };
    state.devices[deviceId] = device;
    changed = true;
    created = true;
  } else if (device.status !== status) {
    device.status = status;
    device.history.push({ status, at: now });
    if (device.history.length > MAX_HISTORY_PER_DEVICE) {
      device.history.splice(0, device.history.length - MAX_HISTORY_PER_DEVICE);
    }
    changed = true;
  }

  const summary = getDeviceSummary(device);

  if (changed) {
    scheduleWrite();
    emitter.emit('device-update', { ...summary, created });
  }

  return { ...summary, changed, created };
}

function getDeviceSummary(device) {
  const last = device.history[device.history.length - 1];
  return {
    id: device.id,
    status: device.status,
    registeredAt: device.registeredAt,
    lastUpdated: last.at,
    historyCount: device.history.length,
  };
}

function listDevices() {
  return Object.values(state.devices).map(getDeviceSummary);
}

function getDevice(deviceId) {
  const device = state.devices[deviceId];
  if (!device) return null;
  return {
    id: device.id,
    status: device.status,
    registeredAt: device.registeredAt,
    lastUpdated: device.history[device.history.length - 1].at,
    history: [...device.history].sort((a, b) => b.at - a.at),
  };
}

function getSummaryCounts() {
  const all = Object.values(state.devices);
  const full = all.filter((d) => d.status === 1).length;
  return { total: all.length, full, empty: all.length - full };
}

function onDeviceUpdate(listener) {
  emitter.on('device-update', listener);
  return () => emitter.off('device-update', listener);
}

function onDeviceDeleted(listener) {
  emitter.on('device-deleted', listener);
  return () => emitter.off('device-deleted', listener);
}

/**
 * Permanently removes a device and its entire status history. This is a
 * deliberate, infrequent user action (unlike pings, which are debounced), so
 * it flushes to disk immediately and awaits the write before returning --
 * the caller only gets a success response once the .json file actually
 * reflects the deletion.
 */
async function deleteDevice(deviceId) {
  const existed = !!state.devices[deviceId];
  if (!existed) return false;
  delete state.devices[deviceId];
  await flushNow();
  emitter.emit('device-deleted', { id: deviceId });
  return true;
}

/** Testing/demo helper: wipe all state and delete the persisted file. */
async function resetAll() {
  state = { devices: {} };
  await flushNow();
}

module.exports = {
  recordPing,
  listDevices,
  getDevice,
  getSummaryCounts,
  deleteDevice,
  onDeviceUpdate,
  onDeviceDeleted,
  flushNow,
  resetAll,
};
