const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/ping?deviceId=DEV-001&status=1
//
// This is the device-facing ingestion endpoint. Devices call this every
// 1-2 seconds; the dedup mechanism in db.recordPing ensures we only persist
// (and only broadcast to the live dashboard) when the status actually flips.
router.get('/ping', (req, res) => {
  const { deviceId, status } = req.query;

  if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
    return res.status(400).json({ error: 'deviceId is required' });
  }
  if (status === undefined || status === '') {
    return res.status(400).json({ error: 'status is required' });
  }

  const result = db.recordPing(deviceId.trim(), status);
  res.json({ ok: true, ...result });
});

module.exports = router;
