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

    const id = req.query.id || (req.params && req.params.id);

    if (req.method === 'DELETE') {
        try {
            // We use 'Archived' property to hide the expense
            await withRetry(() => notion.pages.update({
                page_id: id,
                archived: true
            }));

            invalidateCache('expenses_list');
            return res.status(200).json({ success: true, id });
        } catch (error) {
            console.error('Error deleting/archiving expense:', error);
            return res.status(500).json({ error: 'Failed to delete expense' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
