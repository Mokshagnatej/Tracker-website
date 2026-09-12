const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local for local dev; on Render, env vars are set in the dashboard
dotenv.config({ path: '.env.local' });
dotenv.config(); // also check .env as fallback

const app = express();
app.use(express.json());

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

// Serve static frontend
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for all non-API routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
