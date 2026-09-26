const hybridCryptoService = require('../src/crypto/hybridCryptoService');

describe('HybridCryptoService', () => {
    it('encryptDecryptRoundTrip - should encrypt and decrypt payload symmetrically', () => {
        const payload = {
            txId: '123',
            senderId: 'A',
            receiverId: 'B',
            amount: 50,
            nonce: 1,
            time: Date.now()
        };

        const ciphertext = hybridCryptoService.encrypt(payload);
        const decrypted = hybridCryptoService.decrypt(ciphertext);

        expect(decrypted.txId).toBe(payload.txId);
        expect(decrypted.amount).toBe(payload.amount);
    });

    it('tamperedCiphertextIsRejected - should throw error when decrypting modified ciphertext', () => {
        const payload = { txId: '123', amount: 50 };
        const ciphertext = hybridCryptoService.encrypt(payload);
        
        // Flip one byte in the ciphertext base64 string
        const tampered = ciphertext.substring(0, 100) + (ciphertext[100] === 'A' ? 'B' : 'A') + ciphertext.substring(101);
        
        expect(() => {
            hybridCryptoService.decrypt(tampered);
        }).toThrow();
    });
});
