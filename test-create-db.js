const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { notion } = require('./lib/notion');

async function run() {
  try {
    const dbId = process.env.HABIT_DB_ID;
    const db = await notion.databases.retrieve({ database_id: dbId });
    console.log("Parent:", JSON.stringify(db.parent));
    
    if (db.parent.type === 'page_id') {
      const pageId = db.parent.page_id;
      const newDb = await notion.databases.create({
        parent: { type: 'page_id', page_id: pageId },
        title: [
          { type: 'text', text: { content: 'Habits Metadata' } }
        ],
        properties: {
          Name: { title: {} },
          Category: { select: { options: [] } },
          Time: { select: { options: [{name: 'Morning', color: 'yellow'}, {name: 'Evening', color: 'blue'}, {name: 'Anytime', color: 'gray'}] } },
          Icon: { rich_text: {} }
        }
      });
      console.log("CREATED_DB_ID:", newDb.id);
    } else {
      console.log("Parent is not a page, cannot auto-create. User must create it.");
    }
  } catch (e) {
    console.error(e.message || e);
  }
}
run();
