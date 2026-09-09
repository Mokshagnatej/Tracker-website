const { notion } = require('../lib/notion');
const { getCache, setCache, invalidateCache } = require('../lib/cache');
const { withRetry } = require('../lib/retry');
const { validateExpense } = require('../lib/validate');
const { rateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
    try {
        rateLimit(req);
    } catch (e) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (req.method === 'GET') {
        try {
            const databaseId = process.env.EXPENSE_DB_ID;
            
            // Notion filter to exclude archived (if the property exists).
            // We'll wrap in try-catch in case 'Archived' property doesn't exist yet, 
            // but normally we query everything and just filter on client, or expect it exists.
            // Let's assume they added an 'Archived' checkbox.
            const queryPayload = {
                database_id: databaseId,
                sorts: [{ property: 'Date', direction: 'descending' }]
            };

            const response = await withRetry(() => notion.databases.query(queryPayload));

            const expenses = response.results
                .map(page => ({
                    id: page.id,
                    name: page.properties.Name?.title[0]?.plain_text || 'Unnamed',
                    amount: page.properties.Amount?.number || 0,
                    date: page.properties.Date?.date?.start || null,
                    type: page.properties.Type?.select?.name || 'Expense',
                    categoryId: page.properties.Categories?.relation?.[0]?.id || null,
                    accountId: page.properties.Accounts?.relation?.[0]?.id || null
                }));

            return res.status(200).json(expenses);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return res.status(500).json({ error: 'Failed to fetch expenses' });
        }
    }

    if (req.method === 'POST') {
        try {
            const data = validateExpense(req.body);
            
            const dateStr = data.date || new Date().toISOString().split('T')[0];
            const properties = {
                Name: { title: [{ text: { content: data.name } }] },
                Amount: { number: data.amount },
                Date: { date: { start: dateStr } },
                Type: { select: { name: data.type === 'Income' ? 'Income' : 'Expense' } }
            };

            if (data.categoryId) {
                properties.Categories = { relation: [{ id: data.categoryId }] };
            }
            if (data.accountId) {
                properties.Accounts = { relation: [{ id: data.accountId }] };
            }

            // --- Auto-link to Months database ---
            if (process.env.MONTH_DB_ID) {
                try {
                    const d = new Date(dateStr);
                    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                    const monthNameStr = monthNames[d.getMonth()] + d.getFullYear(); // e.g. "SEP2026"
                    
                    const monthQuery = await notion.databases.query({
                        database_id: process.env.MONTH_DB_ID,
                        filter: { property: 'Name', title: { equals: monthNameStr } }
                    });

                    let monthPageId = null;
                    if (monthQuery.results.length > 0) {
                        monthPageId = monthQuery.results[0].id;
                    } else {
                        // Create it if it doesn't exist
                        const newMonth = await notion.pages.create({
                            parent: { database_id: process.env.MONTH_DB_ID },
                            properties: { Name: { title: [{ text: { content: monthNameStr } }] } }
                        });
                        monthPageId = newMonth.id;
                    }

                    if (monthPageId) {
                        properties.Months = { relation: [{ id: monthPageId }] };
                    }
                } catch (err) {
                    console.error("Failed to link month:", err);
                    // We don't throw, we just proceed without linking if it fails
                }
            }
            // ------------------------------------

            const response = await withRetry(() => notion.pages.create({
                parent: { database_id: process.env.EXPENSE_DB_ID },
                properties
            }));

            invalidateCache('expenses_list');
            
            const newExpense = {
                id: response.id,
                name: data.name,
                amount: data.amount,
                date: dateStr,
                type: data.type === 'Income' ? 'Income' : 'Expense',
                categoryId: data.categoryId || null,
                accountId: data.accountId || null
            };

            return res.status(201).json(newExpense);
        } catch (error) {
            console.error('Error creating expense:', error);
            return res.status(400).json({ error: error.message || 'Failed to create expense' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
