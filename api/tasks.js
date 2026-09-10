const { notion } = require('../lib/notion');
const { getCache, setCache, invalidateCache } = require('../lib/cache');
const { withRetry } = require('../lib/retry');
const { rateLimit } = require('../lib/rate-limit');

const getTodayStr = () => new Date().toISOString().split('T')[0];

module.exports = async function handler(req, res) {
    // Error Check 1: Rate Limiting Validation
    try {
        rateLimit(req);
    } catch (e) {
        return res.status(429).json({ error: 'Too many requests, slow down.' });
    }

    // Error Check 2: Verify Configuration
    const databaseId = process.env.TASK_DB_ID;
    if (!databaseId) {
        console.error('CRITICAL: TASK_DB_ID is not configured in environment variables.');
        return res.status(500).json({ error: 'Server misconfiguration: Database ID missing.' });
    }

    if (req.method === 'POST') {
        try {
            // Error Check 3: Strict Input Validation
            const { name } = req.body;
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ error: 'Invalid task name provided.' });
            }

            const trimmedName = name.trim();

            // Error Check 4: Safe Notion API Update
            await withRetry(() => notion.databases.update({
                database_id: databaseId,
                properties: {
                    [trimmedName]: { checkbox: {} }
                }
            }));
            
            invalidateCache('tasks_list');
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error('Error creating task:', e);
            return res.status(500).json({ error: 'Failed to create task.' });
        }
    }

    if (req.method === 'GET') {
        try {
            // Fetch database schema AND rows in parallel for high performance
            const [dbSchema, response] = await Promise.all([
                withRetry(() => notion.databases.retrieve({ database_id: databaseId })),
                withRetry(() => notion.databases.query({
                    database_id: databaseId,
                    sorts: [{ property: 'date', direction: 'descending' }],
                    page_size: 30
                }))
            ]);

            // Error Check 5: Safely handle missing/empty databases
            if (!response.results || response.results.length === 0) {
                return res.status(200).json([]);
            }

            const todayStr = getTodayStr();
            let todayPage = response.results.find(page => page.properties?.date?.date?.start === todayStr);

            if (!todayPage && response.results.length > 0) {
                todayPage = await withRetry(() => notion.pages.create({
                    parent: { database_id: databaseId },
                    properties: {
                        Name: { title: [{ text: { content: todayStr } }] },
                        date: { date: { start: todayStr } }
                    }
                }));
                // Safely unshift to array
                if (todayPage) {
                    response.results.unshift(todayPage);
                }
            }

            // Safely parse properties to find tasks (checkbox type)
            const tasksList = dbSchema?.properties ? Object.keys(dbSchema.properties).filter(p => dbSchema.properties[p].type === 'checkbox') : [];
            
            // Build a quick lookup dictionary for O(1) reads (performance boost)
            const pageByDate = {};
            response.results.forEach(p => {
                const d = p.properties?.date?.date?.start;
                if (d) pageByDate[d] = p;
            });

            // Generate last 14 days safely
            const last14 = Array.from({ length: 14 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (13 - i));
                return d.toISOString().split('T')[0];
            });

            const result = tasksList.map(taskName => {
                const todayDone = todayPage ? !!todayPage.properties[taskName]?.checkbox : false;

                let streak = 0;
                for (let i = 0; i < response.results.length; i++) {
                    const p = response.results[i];
                    if (p.properties[taskName]?.checkbox) {
                        streak++;
                    } else if (p.properties.date?.date?.start !== todayStr) {
                        break; // Streak broken
                    }
                }

                // Compute per-day history map
                const history = last14.map(date => ({
                    date,
                    done: !!(pageByDate[date]?.properties[taskName]?.checkbox)
                }));

                // Compute weekly completion rate (last 7 days)
                const last7 = last14.slice(7);
                const weeklyDone = last7.filter(d => pageByDate[d.date]?.properties[taskName]?.checkbox).length;
                const weeklyRate = Math.round((weeklyDone / 7) * 100);

                return {
                    id: taskName,
                    name: taskName,
                    done: todayDone,
                    streak,
                    pageId: todayPage ? todayPage.id : null,
                    history,
                    weeklyRate
                };
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('Critical failure fetching tasks:', error);
            return res.status(500).json({ error: 'Failed to fetch tasks due to server error.' });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed.' });
};
