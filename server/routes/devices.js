const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/devices?search=&status=all|1|0&page=1&pageSize=10
router.get('/devices', (req, res) => {
  const { search = '', status = 'all' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));

  const q = String(search).trim().toLowerCase();
  let devices = db.listDevices();

  if (q) {
    devices = devices.filter((d) => d.id.toLowerCase().includes(q));
  }
  if (status === '1' || status === '0') {
    devices = devices.filter((d) => String(d.status) === status);
  }

  devices.sort((a, b) => b.lastUpdated - a.lastUpdated);

  const total = devices.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = devices.slice(start, start + pageSize);

  res.json({
    devices: pageItems,
    page: safePage,
    pageSize,
    total,
    totalPages,
  });
});

// GET /api/devices/summary -- KPI counts for the dashboard header
router.get('/devices/summary', (req, res) => {
  res.json(db.getSummaryCounts());
});

// GET /api/devices/:id -- full history for one device
router.get('/devices/:id', (req, res) => {
  const device = db.getDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });
  res.json(device);
});

module.exports = router;
