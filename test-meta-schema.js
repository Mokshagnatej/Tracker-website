const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { notion } = require('./lib/notion');

async function run() {
  try {
    const metaDbId = process.env.HABIT_META_DB_ID;
    const db = await notion.databases.retrieve({ database_id: metaDbId });
    console.log("PROPERTIES:", JSON.stringify(db.properties, null, 2));
  } catch (e) {
    console.error(e.message || e);
  }
}
run();
