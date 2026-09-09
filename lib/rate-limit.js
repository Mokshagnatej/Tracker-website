const ipRequests = new Map();

function rateLimit(req) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    let record = ipRequests.get(ip);
    if (!record) {
        record = { count: 0, resetTime: now + windowMs };
        ipRequests.set(ip, record);
    }
    
    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
    }
    
    record.count++;
    
    if (Math.random() < 0.1) {
        for (const [key, val] of ipRequests.entries()) {
            if (now > val.resetTime) ipRequests.delete(key);
        }
    }
    
    if (record.count > 60) { // 60 requests per minute
        const error = new Error('Rate limit exceeded');
        error.status = 429;
        throw error;
    }
}

module.exports = { rateLimit };
