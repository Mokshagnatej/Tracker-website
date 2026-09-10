const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { notion } = require('./lib/notion');

async function test() {
  try {
    const dbId = process.env.HABIT_DB_ID;
    console.log("DB ID:", dbId);
    console.log("Updating database to add 'Test Habit'");
    await notion.databases.update({
      database_id: dbId,
      properties: {
        'Test Habit': { checkbox: {} }
      }
    });
    console.log("Added habit");
    
    console.log("Deleting 'Test Habit'");
    await notion.databases.update({
      database_id: dbId,
      properties: {
        'Test Habit': null
      }
    });
    console.log("Deleted habit");
  } catch (e) {
    console.error("Error:", e.body || e);
  }
}
test();
