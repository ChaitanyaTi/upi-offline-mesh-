const crypto = require('crypto');

class HybridCryptoService {
    constructor() {
        this.keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
    }

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    /**
     * Encrypts data using Hybrid Encryption (AES-256-GCM + RSA-OAEP).
     * Format: [256 bytes RSA-encrypted AES key][12 bytes IV][AES ciphertext + 16-byte GCM tag]
     * @param {Object} payload JSON payload
     * @returns {string} base64 encoded ciphertext
     */
    encrypt(payload) {
        const payloadStr = JSON.stringify(payload);
        
        // 1. Generate fresh AES-256 key and IV
        const aesKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);

        // 2. Encrypt payload with AES-256-GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
        const ciphertext = Buffer.concat([cipher.update(payloadStr, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag(); // 16 bytes

        // 3. Encrypt AES key with RSA-OAEP
        const encryptedAesKey = crypto.publicEncrypt({
            key: this.keyPair.publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        }, aesKey); // 256 bytes for RSA-2048

        // 4. Concatenate
        const finalBuffer = Buffer.concat([encryptedAesKey, iv, ciphertext, authTag]);
        
        return finalBuffer.toString('base64');
    }

    /**
     * Decrypts ciphertext using Hybrid Encryption.
     * @param {string} ciphertextBase64 base64 encoded ciphertext
     * @returns {Object} JSON payload
     */
    decrypt(ciphertextBase64) {
        const finalBuffer = Buffer.from(ciphertextBase64, 'base64');
        
        // 1. Extract parts
        // [256 bytes RSA-encrypted AES key][12 bytes IV][AES ciphertext + 16-byte GCM tag]
        if (finalBuffer.length < 256 + 12 + 16) {
            throw new Error('Ciphertext too short');
        }

        const encryptedAesKey = finalBuffer.subarray(0, 256);
        const iv = finalBuffer.subarray(256, 256 + 12);
        const authTag = finalBuffer.subarray(finalBuffer.length - 16);
        const ciphertext = finalBuffer.subarray(256 + 12, finalBuffer.length - 16);

        // 2. Decrypt AES key with RSA private key
        let aesKey;
        try {
            aesKey = crypto.privateDecrypt({
                key: this.keyPair.privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            }, encryptedAesKey);
        } catch (e) {
            throw new Error('Failed to decrypt AES key: ' + e.message);
        }

        // 3. Decrypt payload with AES-256-GCM
        try {
            const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
            decipher.setAuthTag(authTag);
            
            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            return JSON.parse(decrypted.toString('utf8'));
        } catch (e) {
            throw new Error('Failed to decrypt payload or invalid auth tag: ' + e.message);
        }
    }
    
    hashCiphertext(ciphertextBase64) {
        const hash = crypto.createHash('sha256');
        hash.update(ciphertextBase64);
        return hash.digest('hex');
    }
}

// Singleton instance
const hybridCryptoService = new HybridCryptoService();
module.exports = hybridCryptoService;
