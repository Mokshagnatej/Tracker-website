const { notion } = require('../lib/notion');
const { rateLimit } = require('../lib/rate-limit');
const { withRetry } = require('../lib/retry');

module.exports = async function handler(req, res) {
    try {
        rateLimit(req);
    } catch (e) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (req.method === 'POST') {
        try {
            const { pageId, mood } = req.body;
            if (!pageId || !mood) return res.status(400).json({ error: 'Missing pageId or mood' });

            await withRetry(() => notion.pages.update({
                page_id: pageId,
                properties: {
                    Mood: {
                        select: { name: mood }
                    }
                }
            }));

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error updating mood:', error);
            return res.status(500).json({ error: 'Failed to update mood' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
