// Simulates a fleet of real devices hammering the ping endpoint every 1-2s,
// mostly with the SAME status repeated (as real hardware would) so you can
// see the dedup mechanism in action: watch server logs / devices.json only
// grow on real changes, not on every ping.
//
// Usage: node scripts/simulate-devices.js [--devices=8] [--base=http://localhost:4000]

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const BASE = args.base || 'http://localhost:4000';
const DEVICE_COUNT = parseInt(args.devices, 10) || 8;
const deviceIds = Array.from({ length: DEVICE_COUNT }, (_, i) => `DEV-${String(i + 1).padStart(3, '0')}`);

// Each device remembers its own "current" status; it flips occasionally
// but pings constantly, so most requests are duplicates -- exactly the
// scenario the dedup mechanism exists for.
const currentStatus = new Map(deviceIds.map((id) => [id, Math.random() < 0.5 ? 1 : 0]));

let sent = 0;
let duplicates = 0;
let changes = 0;

async function pingOnce(id) {
  // ~85% of pings repeat the same status (typical for a sensor at rest).
  if (Math.random() < 0.15) {
    currentStatus.set(id, currentStatus.get(id) === 1 ? 0 : 1);
  }
  const status = currentStatus.get(id);
  const url = `${BASE}/api/ping?deviceId=${encodeURIComponent(id)}&status=${status}`;
  try {
    const res = await fetch(url);
    const body = await res.json();
    sent += 1;
    if (body.changed) changes += 1;
    else duplicates += 1;
    if (body.changed) {
      console.log(`[changed]   ${id} -> ${status === 1 ? 'FULL' : 'EMPTY'}`);
    }
  } catch (err) {
    console.error(`[error] ${id}:`, err.message);
  }
}

function scheduleDevice(id) {
  const jitter = 1000 + Math.random() * 1000; // 1-2s, per spec
  setTimeout(async function tick() {
    await pingOnce(id);
    setTimeout(tick, 1000 + Math.random() * 1000);
  }, jitter);
}

console.log(`Simulating ${DEVICE_COUNT} devices against ${BASE} (every ~1-2s each). Ctrl+C to stop.`);
deviceIds.forEach(scheduleDevice);

setInterval(() => {
  console.log(`--- sent=${sent} duplicates=${duplicates} (discarded) changes=${changes} (persisted) ---`);
}, 5000);
