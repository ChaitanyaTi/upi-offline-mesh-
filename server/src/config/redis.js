// In-memory mock replacing external Redis to allow 100% offline backend
const locks = new Map();

const connectRedis = async () => {
    console.log('Using in-memory lock store (Redis disabled)');
    return true; // mock connection
};

const acquireLock = (key, ttlMs = 10000) => {
    const now = Date.now();
    const existing = locks.get(key);
    
    // Clean up expired locks dynamically
    if (existing && existing < now) {
        locks.delete(key);
    }
    
    if (locks.has(key)) {
        return false; // Lock is already held
    }
    
    locks.set(key, now + ttlMs);
    return true; // Successfully acquired lock
};

const releaseLock = (key) => {
    locks.delete(key);
};

const getRedisClient = () => null;

module.exports = { connectRedis, getRedisClient, acquireLock, releaseLock };
