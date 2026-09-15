const { notion } = require('../../lib/notion');
const { invalidateCache } = require('../../lib/cache');
const { withRetry } = require('../../lib/retry');
const { rateLimit } = require('../../lib/rate-limit');

module.exports = async function handler(req, res) {
    try {
        rateLimit(req);
    } catch (e) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (req.method === 'PATCH') {
        try {
            const habitPropName = req.query.id || (req.params && req.params.id);
            const { done, pageId } = req.body;

            if (!pageId) {
                return res.status(400).json({ error: 'Missing pageId' });
            }

            const response = await withRetry(() => notion.pages.update({
                page_id: pageId,
                properties: {
                    [habitPropName]: { checkbox: Boolean(done) }
                }
            }));

            invalidateCache('habits_list');
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error updating habit:', error);
            return res.status(500).json({ error: 'Failed to update habit' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const habitPropName = req.query.id || (req.params && req.params.id);
            
            await withRetry(() => notion.databases.update({
                database_id: process.env.HABIT_DB_ID,
                properties: {
                    [habitPropName]: null
                }
            }));

            invalidateCache('habits_list');
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error deleting habit:', error);
            return res.status(500).json({ error: 'Failed to delete habit' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const habitName = decodeURIComponent(req.query.id || (req.params && req.params.id));
            const { category, time, icon } = req.body;

            if (!habitName) {
                return res.status(400).json({ error: 'Missing habit name' });
            }

            // Force reload env vars in case the server wasn't restarted
            require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local'), override: true });
            
            const metaDatabaseId = process.env.HABIT_META_DB_ID;
            if (!metaDatabaseId) {
                return res.status(400).json({ error: 'HABIT_META_DB_ID not configured' });
            }

            // Find existing meta page for this habit
            const searchRes = await withRetry(() => notion.databases.query({
                database_id: metaDatabaseId,
                filter: {
                    property: 'Name',
                    title: { equals: habitName }
                }
            }));

            const properties = {};
            if (category) properties.Category = { select: { name: category } };
            if (time) properties.Time = { select: { name: time } };
            if (icon) properties.Icon = { rich_text: [{ text: { content: icon } }] };

            if (searchRes.results.length > 0) {
                // Update existing meta page
                await withRetry(() => notion.pages.update({
                    page_id: searchRes.results[0].id,
                    properties
                }));
            } else {
                // Create new meta page if none exists
                await withRetry(() => notion.pages.create({
                    parent: { database_id: metaDatabaseId },
                    properties: {
                        Name: { title: [{ text: { content: habitName } }] },
                        ...properties
                    }
                }));
            }

            invalidateCache('habits_list');
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error updating habit metadata:', error);
            return res.status(500).json({ error: 'Failed to update habit metadata' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
