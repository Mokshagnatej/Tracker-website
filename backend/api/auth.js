const bcrypt = require('bcryptjs');
const { getClient, ensureAuthTables } = require('../lib/db.js');
const { generateToken } = require('../lib/auth.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, password, newPassword } = req.body || {};
  
  await ensureAuthTables();
  const db = getClient();
  
  // Get stored hash or use default
  const result = await db.execute("SELECT value FROM app_settings WHERE key = 'password_hash'");
  let storedHash = null;
  if (result.rows.length > 0) {
    storedHash = result.rows[0].value;
  }
  
  const defaultPassword = process.env.APP_PASSWORD || 'moksha2026';
  
  if (action === 'login') {
    let isValid = false;
    if (storedHash) {
      isValid = await bcrypt.compare(password, storedHash);
    } else {
      isValid = (password === defaultPassword);
    }
    
    if (isValid) {
      const token = generateToken({ auth: true });
      return res.json({ ok: true, token });
    }
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  if (action === 'change') {
    // verify current password
    let isValid = false;
    if (storedHash) {
      isValid = await bcrypt.compare(password, storedHash);
    } else {
      isValid = (password === defaultPassword);
    }
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute({
      sql: "INSERT INTO app_settings (key, value) VALUES ('password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [hash]
    });
    
    return res.json({ ok: true, message: 'Password updated successfully' });
  }
  
  return res.status(400).json({ error: 'Invalid action' });
};
