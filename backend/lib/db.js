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
async function ensureAuthTables() {
  if (_initialized) return;
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  _initialized = true;
}

module.exports = { getClient, ensureAuthTables };
