const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { notion } = require('./lib/notion');

async function run() {
  try {
    const metaDbId = process.env.HABIT_META_DB_ID;
    console.log("META DB ID:", metaDbId);
    const response = await notion.databases.query({
      database_id: metaDbId,
    });
    console.log("RESULTS:", JSON.stringify(response.results, null, 2));
  } catch (e) {
    console.error(e.message || e);
  }
}
run();
