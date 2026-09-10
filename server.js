const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

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

app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
