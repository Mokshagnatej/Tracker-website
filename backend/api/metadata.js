const { notion } = require('../lib/notion');
const { getCache, setCache, invalidateCache } = require('../lib/cache');
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

    if (req.method === 'POST') {
        try {
            const { type, name } = req.body || {};

            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const trimmedName = name.trim();

            if (type === 'category') {
                if (!process.env.CATEGORY_DB_ID) {
                    return res.status(400).json({ error: 'CATEGORY_DB_ID not configured' });
                }

                // Check if category already exists
                const existing = await withRetry(() => notion.databases.query({
                    database_id: process.env.CATEGORY_DB_ID,
                    filter: { property: 'Name', title: { equals: trimmedName } }
                }));

                if (existing.results.length > 0) {
                    return res.status(200).json({
                        id: existing.results[0].id,
                        name: trimmedName,
                        existed: true
                    });
                }

                const page = await withRetry(() => notion.pages.create({
                    parent: { database_id: process.env.CATEGORY_DB_ID },
                    properties: {
                        Name: { title: [{ text: { content: trimmedName } }] }
                    }
                }));

                invalidateCache('metadata_list');
                return res.status(201).json({ id: page.id, name: trimmedName });

            } else if (type === 'account') {
                if (!process.env.ACCOUNT_DB_ID) {
                    return res.status(400).json({ error: 'ACCOUNT_DB_ID not configured' });
                }

                // Check if account already exists
                const existing = await withRetry(() => notion.databases.query({
                    database_id: process.env.ACCOUNT_DB_ID,
                    filter: { property: 'Name', title: { equals: trimmedName } }
                }));

                if (existing.results.length > 0) {
                    return res.status(200).json({
                        id: existing.results[0].id,
                        name: trimmedName,
                        existed: true
                    });
                }

                const page = await withRetry(() => notion.pages.create({
                    parent: { database_id: process.env.ACCOUNT_DB_ID },
                    properties: {
                        Name: { title: [{ text: { content: trimmedName } }] }
                    }
                }));

                invalidateCache('metadata_list');
                return res.status(201).json({ id: page.id, name: trimmedName });

            } else {
                return res.status(400).json({ error: 'Invalid type. Use "category" or "account".' });
            }
        } catch (error) {
            console.error('Error creating metadata:', error);
            return res.status(500).json({ error: 'Failed to create metadata entry' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
