# Device Status POC

A small Node.js POC: devices `GET` an endpoint to report status (1 = full, 0 = empty),
and a React dashboard shows live status + history for every device.

## Stack

- **Backend:** Express (`server/`), data persisted to a JSON file (`server/data/devices.json`)
- **Frontend:** React + Vite (`client/`), Framer Motion for animation
- **Live updates:** Server-Sent Events push status changes to the dashboard instantly; a "Fetch latest" button is always available as a manual fallback

## Running it

```bash
npm run install:all   # installs server + client deps
npm run dev            # runs API on :4000 and Vite dev server on :5173 together
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the Express API.

For a single-process production-style run:

```bash
npm start               # builds the client, then serves API + built UI from :4000
```

### Simulating real devices

Real hardware isn't available yet, so there's a simulator that pings the API every 1-2
seconds per device, mostly repeating the same status (as real sensors do), to demonstrate
the dedup mechanism live:

```bash
npm run simulate                       # 8 fake devices
node scripts/simulate-devices.js --devices=20 --base=http://localhost:4000
```

Watch the terminal: only real status flips print `[changed]` — everything else is a
duplicate that gets acknowledged but not persisted.

## API

### `GET /api/ping?deviceId=<id>&status=<0|1>`

The device-facing ingestion endpoint. `status=1` → treated as **full**, anything else →
**empty**. Only writes a new history entry when the status actually differs from the
device's last known status; repeat pings with the same status are discarded as
duplicates (but still acknowledged with `changed: false`). First-ever ping for a
`deviceId` auto-registers it and records `registeredAt`.

```json
{ "ok": true, "id": "DEV-001", "status": 1, "changed": true, "created": false,
  "registeredAt": 1785400000000, "lastUpdated": 1785472668035, "historyCount": 3 }
```

### `GET /api/devices?search=&status=all|1|0&page=1&pageSize=10`

Paginated, filterable list of every unique device with its current status, last-updated
timestamp, and registration date.

### `GET /api/devices/summary`

`{ total, full, empty }` counts for the dashboard header.

### `GET /api/devices/:id`

Full status-change history for one device, newest first.

### `GET /api/stream`

Server-Sent Events feed. Emits a `device-update` event (device id/status/timestamp)
every time a device's status actually changes — never for discarded duplicates. This is
what makes the dashboard update without polling or a page refresh.

## Data storage

`server/db.js` keeps the authoritative state in memory and writes it to
`server/data/devices.json` atomically (write to a temp file, then rename) whenever a
real change happens. Writes are coalesced — a burst of rapid duplicate pings from many
devices only triggers one flush to disk once things settle, not one write per ping.
This is a POC-grade store; swap `db.js` for a real database later without touching the
routes, since routes only ever call `recordPing` / `listDevices` / `getDevice`.

## Frontend pages

- **Live Dashboard** (`/`) — animated card grid, current status per device, pulses on
  live change via SSE, KPI counts, manual "Fetch latest" button.
- **All Devices** (`/devices`) — searchable, filterable (Full/Empty/All), paginated
  table. Built to match the mock export you provided (same colors, fonts, layout).
- **Device Detail** (`/devices/:id`) — current status + full history timeline. Each
  entry shows a locale-relative time ("3 min ago", "5 days ago") that switches to an
  absolute date once an entry is 30+ days old.

## Note on the original mocks

The three exported mock files (`Dashboard`, `Device List`, `Device Detail`) were
byte-identical — all three actually contained the "Device List" (table/search/pagination)
design. That page was rebuilt to match the mock exactly. The Dashboard and Device Detail
pages were designed from scratch to match that same visual language (same fonts, colors,
card/pill styles) since no separate mocks for those existed.
