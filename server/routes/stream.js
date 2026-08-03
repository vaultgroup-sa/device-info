const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/stream -- Server-Sent Events feed. Pushes a 'device-update' event
// whenever a device's status actually changes (never for discarded
// duplicates). Lets the dashboard update live without polling or a manual
// refresh, while still leaving a manual "Fetch latest" button as a fallback.
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 2000\n\n');

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('ready', { at: Date.now() });

  const unsubscribe = db.onDeviceUpdate((payload) => {
    send('device-update', payload);
  });
  const unsubscribeDelete = db.onDeviceDeleted((payload) => {
    send('device-deleted', payload);
  });

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    unsubscribeDelete();
    res.end();
  });
});

module.exports = router;
