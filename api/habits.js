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
            const { name, category = 'Other', time = 'Anytime', icon = '◈' } = req.body;
            if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Invalid name' });

            const trimmed = name.trim();

            await Promise.all([
                withRetry(() => notion.databases.update({
                    database_id: process.env.HABIT_DB_ID,
                    properties: {
                        [trimmed]: { checkbox: {} }
                    }
                })),
                process.env.HABIT_META_DB_ID ? withRetry(() => notion.pages.create({
                    parent: { database_id: process.env.HABIT_META_DB_ID },
                    properties: {
                        Name: { title: [{ text: { content: trimmed } }] },
                        Category: { select: { name: category } },
                        Time: { select: { name: time } },
                        Icon: { rich_text: [{ text: { content: icon } }] }
                    }
                })).catch(e => console.error("Failed to add to meta DB", e)) : Promise.resolve()
            ]);
            
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
            const metaDatabaseId = process.env.HABIT_META_DB_ID;

            // Fetch database schema, rows, and metadata in parallel
            const [dbSchema, response, metaResponse] = await Promise.all([
                withRetry(() => notion.databases.retrieve({ database_id: databaseId })),
                withRetry(() => notion.databases.query({
                    database_id: databaseId,
                    sorts: [{ property: 'date', direction: 'descending' }],
                    page_size: 30
                })),
                metaDatabaseId ? withRetry(() => notion.databases.query({
                    database_id: metaDatabaseId
                })).catch(() => ({ results: [] })) : { results: [] }
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

            const todayMood = todayPage?.properties?.Mood?.select?.name || null;
            const todayPageId = todayPage?.id || null;

            // Use the DATABASE SCHEMA to get ALL checkbox habits
            const habitsList = Object.keys(dbSchema.properties)
                .filter(p => dbSchema.properties[p].type === 'checkbox');
            
            // Build a lookup: date string -> page
            const pageByDate = {};
            response.results.forEach(p => {
                const d = p.properties.date?.date?.start;
                if (d) pageByDate[d] = p;
            });
            
            // Build metadata lookup
            const metaMap = {};
            if (metaResponse.results) {
                metaResponse.results.forEach(page => {
                    const name = page.properties.Name?.title?.[0]?.plain_text;
                    if (name) {
                        metaMap[name] = {
                            category: page.properties.Category?.select?.name || 'Other',
                            time: page.properties.Time?.select?.name || 'Anytime',
                            icon: page.properties.Icon?.rich_text?.[0]?.plain_text || '◈'
                        };
                    }
                });
            }

            // Generate last 14 days (oldest first)
            const last14 = Array.from({ length: 14 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (13 - i));
                return d.toISOString().split('T')[0];
            });
            
            // Generate last 28 days for heatmap
            const last28 = Array.from({ length: 28 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (27 - i));
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

                // Per-day history (14 days for the dot list)
                const history = last14.map(date => ({
                    date,
                    done: !!(pageByDate[date]?.properties[habit]?.checkbox)
                }));
                
                // 28 days history for heatmap
                const heatmapHistory = last28.map(date => ({
                    date,
                    done: !!(pageByDate[date]?.properties[habit]?.checkbox)
                }));

                // Weekly completion rate (last 7 days)
                const last7 = last14.slice(7);
                const weeklyDone = last7.filter(d => d.done).length;
                const weeklyRate = Math.round((weeklyDone / 7) * 100);
                
                const meta = metaMap[habit] || { category: 'Other', time: 'Anytime', icon: '◈' };

                return {
                    id: habit,
                    name: habit,
                    done: todayDone,
                    streak,
                    pageId: todayPage ? todayPage.id : null,
                    history,
                    heatmapHistory,
                    weeklyRate,
                    category: meta.category,
                    time: meta.time,
                    icon: meta.icon
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
