const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        const res = await client.execute("SELECT * FROM app_settings WHERE key = 'password_hash'");
        console.log("DB response:", res.rows);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
