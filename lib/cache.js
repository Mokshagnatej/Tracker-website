const cache = new Map();

function getCache(key) {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
    }
    return item.value;
}

function setCache(key, value, ttlSeconds = 30) {
    const expiry = Date.now() + (ttlSeconds * 1000);
    cache.set(key, { value, expiry });
}

function invalidateCache(key) {
    cache.delete(key);
}

module.exports = { getCache, setCache, invalidateCache };
