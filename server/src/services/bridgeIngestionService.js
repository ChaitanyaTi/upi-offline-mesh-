const idempotencyService = require('./idempotencyService');
const hybridCryptoService = require('../crypto/hybridCryptoService');
const SettlementService = require('./settlementService');

class BridgeIngestionService {
    /**
     * Ingests a mesh packet from a bridge node.
     * @param {Object} packet MeshPacket { packetId, ttl, createdAt, ciphertext }
     * @returns {Object} result { outcome, packetHash, reason, transactionId }
     */
    static async ingest(packet) {
        const { packetId, ttl, createdAt, ciphertext, hops } = packet;

        // 1. Hash ciphertext
        const packetHash = hybridCryptoService.hashCiphertext(ciphertext);

        // 2. Claim idempotency
        if (!idempotencyService.claim(packetHash)) {
            return {
                outcome: 'DUPLICATE_DROPPED',
                packetHash,
                reason: 'Packet hash already claimed'
            };
        }

        let payload;
        try {
            // 3. Decrypt (AES-GCM tag verification happens here)
            payload = hybridCryptoService.decrypt(ciphertext);
        } catch (error) {
            return {
                outcome: 'INVALID',
                packetHash,
                reason: 'Decryption or authentication failed: ' + error.message
            };
        }

        // 4. Freshness check: signedAt within last 24h
        const { txId, senderId, receiverId, amount, nonce, time } = payload;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - time > oneDay) {
            return {
                outcome: 'INVALID',
                packetHash,
                reason: 'Packet is too old (>24h)'
            };
        }

        // 5. Settle
        try {
            const txData = {
                txId,
                senderId,
                receiverId,
                amount,
                nonce,
                signature: 'hybrid-encrypted', // GCM tag replaces explicit signature for integrity
                hops: hops || [],
                packetHash
            };
            const settledTx = await SettlementService.settleTransaction(txData);
            
            return {
                outcome: 'SETTLED',
                packetHash,
                transactionId: settledTx._id // or txId
            };
        } catch (error) {
            return {
                outcome: 'INVALID', // or REJECTED if insufficient funds
                packetHash,
                reason: 'Settlement failed: ' + error.message
            };
        }
    }
}

module.exports = BridgeIngestionService;
