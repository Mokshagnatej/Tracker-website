const { notion } = require('../../lib/notion');
const { invalidateCache } = require('../../lib/cache');
const { withRetry } = require('../../lib/retry');
const { rateLimit } = require('../../lib/rate-limit');

module.exports = async function handler(req, res) {
    // Check 1: Rate limiting
    try {
        rateLimit(req);
    } catch (e) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    // Check 2: Configuration check
    const databaseId = process.env.TASK_DB_ID;
    if (!databaseId) {
        return res.status(500).json({ error: 'Missing TASK_DB_ID config' });
    }

    if (req.method === 'PATCH') {
        try {
            // Check 3: Request payload validation
            const taskPropName = req.query.id || (req.params && req.params.id);
            if (!taskPropName) {
                return res.status(400).json({ error: 'Task ID is missing' });
            }

            const { done, pageId } = req.body;
            if (!pageId) {
                return res.status(400).json({ error: 'Missing pageId in request body' });
            }

            // Check 4: Safe updates using withRetry
            await withRetry(() => notion.pages.update({
                page_id: pageId,
                properties: {
                    [taskPropName]: { checkbox: Boolean(done) }
                }
            }));

            invalidateCache('tasks_list');
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error updating task:', error);
            return res.status(500).json({ error: 'Failed to update task.' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            // Check 5: Request validation for delete
            const taskPropName = req.query.id || (req.params && req.params.id);
            if (!taskPropName) {
                return res.status(400).json({ error: 'Task ID is missing' });
            }
            
            await withRetry(() => notion.databases.update({
                database_id: databaseId,
                properties: {
                    [taskPropName]: null
                }
            }));

            invalidateCache('tasks_list');
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error deleting task:', error);
            return res.status(500).json({ error: 'Failed to delete task.' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
