class IdempotencyService {
    constructor() {
        this.cache = new Map();
        // Periodically clean up old hashes (e.g. older than 24 hours)
        // In a real app this would be Redis with SET NX EX 86400
        setInterval(() => this.cleanup(), 60 * 60 * 1000); // every hour
    }

    /**
     * Attempts to claim a hash.
     * @param {string} hash SHA-256 hash of ciphertext
     * @returns {boolean} true if claimed successfully, false if duplicate
     */
    claim(hash) {
        if (this.cache.has(hash)) {
            return false; // Duplicate
        }
        this.cache.set(hash, Date.now());
        return true; // Claimed successfully
    }

    cleanup() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        for (const [hash, timestamp] of this.cache.entries()) {
            if (now - timestamp > oneDay) {
                this.cache.delete(hash);
            }
        }
    }
    
    reset() {
        this.cache.clear();
    }
}

// Singleton
const idempotencyService = new IdempotencyService();
module.exports = idempotencyService;
