const { notion } = require('../lib/notion');
const { getCache, setCache, invalidateCache } = require('../lib/cache');
const { withRetry } = require('../lib/retry');
const { rateLimit } = require('../lib/rate-limit');

const getTodayStr = () => new Date().toISOString().split('T')[0];

module.exports = async function handler(req, res) {
    try {
        rateLimit(req);
    } catch (e) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (req.method === 'POST') {
        try {
            const { name } = req.body;
            if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Invalid name' });

            await withRetry(() => notion.databases.update({
                database_id: process.env.HABIT_DB_ID,
                properties: {
                    [name.trim()]: { checkbox: {} }
                }
            }));
            
            invalidateCache('habits_list');
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error('Error creating habit:', e);
            return res.status(500).json({ error: 'Failed to create habit' });
        }
    }

    if (req.method === 'GET') {
        try {
            const databaseId = process.env.HABIT_DB_ID;

            // Fetch database schema AND rows in parallel
            const [dbSchema, response] = await Promise.all([
                withRetry(() => notion.databases.retrieve({ database_id: databaseId })),
                withRetry(() => notion.databases.query({
                    database_id: databaseId,
                    sorts: [{ property: 'date', direction: 'descending' }],
                    page_size: 30
                }))
            ]);

            if (!response.results || response.results.length === 0) {
                return res.status(200).json({ habits: [], mood: null, todayPageId: null });
            }

            const todayStr = getTodayStr();
            let todayPage = response.results.find(page => page.properties.date?.date?.start === todayStr);

            if (!todayPage && response.results.length > 0) {
                todayPage = await withRetry(() => notion.pages.create({
                    parent: { database_id: databaseId },
                    properties: {
                        Name: { title: [{ text: { content: todayStr } }] },
                        date: { date: { start: todayStr } }
                    }
                }));
                response.results.unshift(todayPage);
            }

            const moodExists = !!dbSchema.properties['Mood'];
            if (!moodExists) {
                try {
                    await withRetry(() => notion.databases.update({
                        database_id: databaseId,
                        properties: {
                            Mood: {
                                select: {
                                    options: [
                                        { name: "Awesome", color: "green" },
                                        { name: "Good", color: "blue" },
                                        { name: "Okay", color: "yellow" },
                                        { name: "Bad", color: "red" }
                                    ]
                                }
                            }
                        }
                    }));
                } catch (e) {
                    console.error("Error adding Mood property", e);
                }
            }

            const todayMood = todayPage?.properties?.Mood?.select?.name || null;
            const todayPageId = todayPage?.id || null;

            // Use the DATABASE SCHEMA to get ALL checkbox habits (never misses any)
            const habitsList = Object.keys(dbSchema.properties)
                .filter(p => dbSchema.properties[p].type === 'checkbox');
            
            // Build a lookup: date string -> page
            const pageByDate = {};
            response.results.forEach(p => {
                const d = p.properties.date?.date?.start;
                if (d) pageByDate[d] = p;
            });

            // Generate last 14 days (oldest first)
            const last14 = Array.from({ length: 14 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (13 - i));
                return d.toISOString().split('T')[0];
            });

            const result = habitsList.map(habit => {
                const todayDone = todayPage ? !!todayPage.properties[habit]?.checkbox : false;

                let streak = 0;
                for (let i = 0; i < response.results.length; i++) {
                    const p = response.results[i];
                    if (p.properties[habit]?.checkbox) {
                        streak++;
                    } else if (p.properties.date?.date?.start !== todayStr) {
                        break;
                    }
                }

                // Per-day history for heatmap
                const history = last14.map(date => ({
                    date,
                    done: !!(pageByDate[date]?.properties[habit]?.checkbox)
                }));

                // Weekly completion rate (last 7 days, excluding today)
                const last7 = last14.slice(7);
                const weeklyDone = last7.filter(d => pageByDate[d.date]?.properties[habit]?.checkbox).length;
                const weeklyRate = Math.round((weeklyDone / 7) * 100);

                return {
                    id: habit,
                    name: habit,
                    done: todayDone,
                    streak,
                    pageId: todayPage ? todayPage.id : null,
                    history,
                    weeklyRate
                };
            });

            return res.status(200).json({ habits: result, mood: todayMood, todayPageId });
        } catch (error) {
            console.error('Error fetching habits:', error);
            return res.status(500).json({ error: 'Failed to fetch habits' });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};
