const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(fn, maxRetries = 3, baseDelay = 300) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                throw error;
            }
            // Notion API allows ~3 req/s. We space out bursts using exponential backoff
            const delay = baseDelay * Math.pow(3, attempt - 1) + Math.random() * 100;
            console.warn(`Notion API call failed, retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
            await wait(delay);
        }
    }
}

module.exports = { withRetry, wait };
