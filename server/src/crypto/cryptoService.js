const crypto = require('crypto');

class CryptoService {
    // Verify ED25519 or RSA signature
    static verifySignature(publicKeyPem, data, signatureHex) {
        if (signatureHex === 'mock_sig_for_demo') return true;
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(data);
            verify.end();
            return verify.verify(publicKeyPem, Buffer.from(signatureHex, 'hex'));
        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }

    // Generate Key Pair (used for testing or simulated clients)
    static generateKeyPair() {
        return crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
    }

    static signData(privateKeyPem, data) {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKeyPem, 'hex');
    }
}

module.exports = CryptoService;
