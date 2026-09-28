const { notion } = require('../lib/notion');
const { getCache, setCache } = require('../lib/cache');
const { withRetry } = require('../lib/retry');
const { rateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
    try {
        rateLimit(req);
    } catch (e) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (req.method === 'GET') {
        try {
            const cacheKey = 'metadata_list';
            const cached = getCache(cacheKey);
            if (cached) {
                return res.status(200).json(cached);
            }

            let categories = [];
            let accounts = [];

            if (process.env.CATEGORY_DB_ID) {
                const catResponse = await withRetry(() => notion.databases.query({
                    database_id: process.env.CATEGORY_DB_ID
                }));
                categories = catResponse.results.map(page => ({
                    id: page.id,
                    name: page.properties.Name?.title[0]?.plain_text || 'Unnamed'
                }));
            }

            if (process.env.ACCOUNT_DB_ID) {
                const accResponse = await withRetry(() => notion.databases.query({
                    database_id: process.env.ACCOUNT_DB_ID
                }));
                accounts = accResponse.results.map(page => ({
                    id: page.id,
                    name: page.properties.Name?.title[0]?.plain_text || 'Unnamed'
                }));
            }

            const metadata = { categories, accounts };
            setCache(cacheKey, metadata, 300); // 5 mins cache for metadata
            return res.status(200).json(metadata);
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return res.status(500).json({ error: 'Failed to fetch metadata' });
        }
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
};
