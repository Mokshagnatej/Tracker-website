module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  // The password is set via environment variable, with a default for local dev
  const expected = process.env.APP_PASSWORD || 'moksha2026';

  if (password === expected) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
};
