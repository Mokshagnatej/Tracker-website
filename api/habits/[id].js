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

    return res.status(405).json({ error: 'Method Not Allowed' });
};
