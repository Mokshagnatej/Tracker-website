const { createClient } = require('@libsql/client');

let client;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not set');
    client = createClient({ url, authToken: authToken || undefined });
  }
  return client;
}

let _initialized = false;
async function ensureTables() {
  if (_initialized) return;
  const db = getClient();
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS base (
        idx INTEGER PRIMARY KEY,
        total INTEGER NOT NULL,
        held INTEGER NOT NULL,
        present INTEGER NOT NULL,
        absent INTEGER NOT NULL
      )`
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        course_idx INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('P', 'A')),
        weight INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(date, course_idx)
      )`
    }
  ], 'write');
  _initialized = true;
}

module.exports = async function handler(req, res) {
  try {
    await ensureTables();
    const db = getClient();

    // GET /api/attendance — return all base + log data
    if (req.method === 'GET') {
      const [baseRes, logRes] = await Promise.all([
        db.execute('SELECT idx, total, held, present, absent FROM base ORDER BY idx'),
        db.execute('SELECT id, date, course_idx as i, status as s, weight as w FROM log ORDER BY date DESC, course_idx')
      ]);
      return res.json({
        base: baseRes.rows,
        log: logRes.rows
      });
    }

    // PUT /api/attendance/base — bulk update baseline numbers
    if (req.method === 'PUT' && req.url.includes('/base')) {
      const { base } = req.body;
      if (!Array.isArray(base)) return res.status(400).json({ error: 'base must be an array' });

      const stmts = base.map(item => ({
        sql: `INSERT INTO base (idx, total, held, present, absent) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(idx) DO UPDATE SET total=excluded.total, held=excluded.held, present=excluded.present, absent=excluded.absent`,
        args: [item.idx, item.total, item.held, item.present ?? item.p, item.absent ?? item.a]
      }));
      await db.batch(stmts, 'write');
      return res.json({ ok: true, count: base.length });
    }

    // POST /api/attendance/log/bulk — bulk set marks for a day (must be before /log)
    if (req.method === 'POST' && req.url.includes('/log/bulk')) {
      const { date, marks } = req.body;
      if (!date || !Array.isArray(marks)) return res.status(400).json({ error: 'date, marks required' });

      const stmts = [];
      for (const m of marks) {
        if (m.s) {
          stmts.push({
            sql: `INSERT INTO log (date, course_idx, status, weight) VALUES (?, ?, ?, ?)
                  ON CONFLICT(date, course_idx) DO UPDATE SET status=excluded.status, weight=excluded.weight`,
            args: [date, m.i, m.s, m.w || 1]
          });
        } else {
          stmts.push({
            sql: 'DELETE FROM log WHERE date = ? AND course_idx = ?',
            args: [date, m.i]
          });
        }
      }
      if (stmts.length) await db.batch(stmts, 'write');
      return res.json({ ok: true });
    }

    // POST /api/attendance/log — add or replace a daily mark
    if (req.method === 'POST' && req.url.includes('/log')) {
      const { date, i, s, w } = req.body;
      if (!date || i == null || !s) return res.status(400).json({ error: 'date, i, s required' });

      await db.execute({
        sql: `INSERT INTO log (date, course_idx, status, weight) VALUES (?, ?, ?, ?)
              ON CONFLICT(date, course_idx) DO UPDATE SET status=excluded.status, weight=excluded.weight`,
        args: [date, i, s, w || 1]
      });
      return res.json({ ok: true });
    }

    // DELETE /api/attendance/log/clear — clear entire log
    if (req.method === 'DELETE' && req.url.includes('/log/clear')) {
      await db.execute('DELETE FROM log');
      return res.json({ ok: true });
    }

    // DELETE /api/attendance/log — remove a daily mark
    if (req.method === 'DELETE' && req.url.includes('/log')) {
      const { date, i } = req.body || {};
      if (date != null && i != null) {
        await db.execute({
          sql: 'DELETE FROM log WHERE date = ? AND course_idx = ?',
          args: [date, i]
        });
      }
      return res.json({ ok: true });
    }

    // PUT /api/attendance/reset — reset base to original + clear log
    if (req.method === 'PUT' && req.url.includes('/reset')) {
      await db.batch([
        { sql: 'DELETE FROM base' },
        { sql: 'DELETE FROM log' }
      ], 'write');
      return res.json({ ok: true });
    }

    // POST /api/attendance/restore — restore from backup JSON
    if (req.method === 'POST' && req.url.includes('/restore')) {
      const { base, log } = req.body;
      const stmts = [
        { sql: 'DELETE FROM base' },
        { sql: 'DELETE FROM log' }
      ];
      if (Array.isArray(base)) {
        for (const b of base) {
          stmts.push({
            sql: `INSERT INTO base (idx, total, held, present, absent) VALUES (?, ?, ?, ?, ?)
                  ON CONFLICT(idx) DO UPDATE SET total=excluded.total, held=excluded.held, present=excluded.present, absent=excluded.absent`,
            args: [b.idx ?? b.i, b.total, b.held, b.present ?? b.p, b.absent ?? b.a]
          });
        }
      }
      if (Array.isArray(log)) {
        for (const l of log) {
          stmts.push({
            sql: `INSERT INTO log (date, course_idx, status, weight) VALUES (?, ?, ?, ?)
                  ON CONFLICT(date, course_idx) DO UPDATE SET status=excluded.status, weight=excluded.weight`,
            args: [l.date ?? l.d, l.i ?? l.course_idx, l.s ?? l.status, l.w ?? l.weight ?? 1]
          });
        }
      }
      await db.batch(stmts, 'write');
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[attendance API error]', err);
    res.status(500).json({ error: err.message });
  }
};
