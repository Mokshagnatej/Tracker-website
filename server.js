const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.local for local dev; on Render, env vars are set in the dashboard
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') }); // also check .env as fallback

const app = express();
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

// API routes
app.all('/api/expenses', (req, res) => require('./api/expenses.js')(req, res));
app.all('/api/expenses/:id', (req, res) => {
    if(!req.query) req.query = {};
    req.query.id = req.params.id;
    require('./api/expenses/[id].js')(req, res);
});
app.all('/api/habits', (req, res) => require('./api/habits.js')(req, res));
app.all('/api/habits/:id', (req, res) => {
    if(!req.query) req.query = {};
    req.query.id = req.params.id;
    require('./api/habits/[id].js')(req, res);
});
app.all('/api/metadata', (req, res) => require('./api/metadata.js')(req, res));
app.all('/api/mood', (req, res) => require('./api/mood.js')(req, res));
app.post('/api/auth', (req, res) => require('./api/auth.js')(req, res));
app.post('/api/attendance-upload', (req, res) => require('./api/attendance-upload.js')(req, res));

// Attendance API (SQLite-backed)
app.get('/api/attendance', (req, res) => require('./api/attendance.js')(req, res));
app.put('/api/attendance/base', (req, res) => require('./api/attendance.js')(req, res));
app.post('/api/attendance/log/bulk', (req, res) => require('./api/attendance.js')(req, res));
app.post('/api/attendance/log', (req, res) => require('./api/attendance.js')(req, res));
app.delete('/api/attendance/log/clear', (req, res) => require('./api/attendance.js')(req, res));
app.delete('/api/attendance/log', (req, res) => require('./api/attendance.js')(req, res));
app.put('/api/attendance/reset', (req, res) => require('./api/attendance.js')(req, res));
app.post('/api/attendance/restore', (req, res) => require('./api/attendance.js')(req, res));

// Serve static frontend. Prefer `dist` (production build); fall back to `public` for local/dev.
const staticDir = fs.existsSync(path.join(__dirname, 'dist'))
  ? 'dist'
  : fs.existsSync(path.join(__dirname, 'public'))
    ? 'public'
    : 'dist';
app.use(express.static(path.join(__dirname, staticDir)));

// SPA fallback — serve index.html from the chosen static dir for all non-API routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, staticDir, 'index.html'));
});

// Global error handler — prevents crash on unhandled errors
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
