const path = require('path');
const express = require('express');
const cors = require('cors');

const pingRoutes = require('./routes/ping');
const deviceRoutes = require('./routes/devices');
const streamRoutes = require('./routes/stream');

const PORT = process.env.PORT || 4000;
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, at: Date.now() }));

app.use('/api', pingRoutes);
app.use('/api', deviceRoutes);
app.use('/api', streamRoutes);

// In production (npm start), serve the built React app from the same server.
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Device status API listening on http://localhost:${PORT}`);
});
