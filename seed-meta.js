const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { notion } = require('./lib/notion');

async function run() {
  try {
    const metaDbId = process.env.HABIT_META_DB_ID;
    
    // 1. Update Schema
    console.log("Updating Schema...");
    await notion.databases.update({
      database_id: metaDbId,
      properties: {
        Category: { select: { options: [
          {name: 'Mindfulness', color: 'purple'},
          {name: 'Fitness', color: 'green'},
          {name: 'Learning', color: 'blue'},
          {name: 'Health', color: 'red'},
          {name: 'Digital', color: 'orange'},
          {name: 'Wellness', color: 'default'},
          {name: 'Productivity', color: 'yellow'}
        ] } },
        Time: { select: { options: [
          {name: 'Morning', color: 'yellow'}, 
          {name: 'Evening', color: 'blue'}, 
          {name: 'Anytime', color: 'gray'}
        ] } },
        Icon: { rich_text: {} }
      }
    });

    // 2. Seed Data
    const habitsToSeed = [
      { name: "Meditate", category: "Mindfulness", time: "Morning", icon: "🧘‍♀️" },
      { name: "Read 30 pages", category: "Learning", time: "Evening", icon: "📚" },
      { name: "Morning run", category: "Fitness", time: "Morning", icon: "🏃‍♂️" },
      { name: "Drink 2L water", category: "Health", time: "Anytime", icon: "💧" },
      { name: "No social media", category: "Digital", time: "Anytime", icon: "📵" },
      { name: "Journal", category: "Mindfulness", time: "Evening", icon: "✍️" },
      { name: "Cold shower", category: "Wellness", time: "Morning", icon: "🚿" },
      { name: "Deep work 2h", category: "Productivity", time: "Morning", icon: "⚡️" }
    ];

    console.log("Seeding data...");
    for (const h of habitsToSeed) {
      await notion.pages.create({
        parent: { database_id: metaDbId },
        properties: {
          Name: { title: [{ text: { content: h.name } }] },
          Category: { select: { name: h.category } },
          Time: { select: { name: h.time } },
          Icon: { rich_text: [{ text: { content: h.icon } }] }
        }
      });
      console.log(`Seeded ${h.name}`);
    }
    console.log("Done!");
  } catch (e) {
    console.error(e.message || e);
  }
}
run();
