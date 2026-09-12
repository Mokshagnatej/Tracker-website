const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { notion } = require('./lib/notion');

async function run() {
  try {
    const parentId = "2db8685b-cf33-8084-8502-e5802ee301ae";
    const newDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: parentId },
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
  } catch (e) {
    console.error(e.message || e);
  }
}
run();
