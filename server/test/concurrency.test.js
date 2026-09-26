const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const BridgeIngestionService = require('../src/services/bridgeIngestionService');
const idempotencyService = require('../src/services/idempotencyService');
const hybridCryptoService = require('../src/crypto/hybridCryptoService');
const Account = require('../src/models/Account');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
}, 600000);

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe('Idempotency Concurrency', () => {
    beforeEach(async () => {
        await Account.deleteMany({});
        idempotencyService.reset(); // clear idempotency cache
        await Account.create([
            { deviceId: 'A', publicKey: 'dummy', balance: 1000, nonce: 0 },
            { deviceId: 'B', publicKey: 'dummy', balance: 500, nonce: 0 }
        ]);
    });

    it('singlePacketDeliveredByThreeBridgesSettlesExactlyOnce - prevents duplicate storms', async () => {
        // 1. Prepare packet
        const payload = {
            txId: `tx-${Date.now()}`,
            senderId: 'A',
            receiverId: 'B',
            amount: 150,
            nonce: 1,
            time: Date.now()
        };
        const ciphertext = hybridCryptoService.encrypt(payload);
        const packet = {
            packetId: payload.txId,
            ttl: 5,
            createdAt: payload.time,
            ciphertext,
            hops: ['A', 'C', 'Bridge']
        };

        // 2. Deliver exactly the same packet simultaneously 3 times
        const results = await Promise.all([
            BridgeIngestionService.ingest(packet),
            BridgeIngestionService.ingest(packet),
            BridgeIngestionService.ingest(packet)
        ]);

        // 3. Verify exactly one settled, two dropped
        const settled = results.filter(r => r.outcome === 'SETTLED');
        const dropped = results.filter(r => r.outcome === 'DUPLICATE_DROPPED');

        if (settled.length !== 1) {
            console.log('Test results:', JSON.stringify(results, null, 2));
        }

        expect(settled.length).toBe(1);
        expect(dropped.length).toBe(2);

        // 4. Verify ledger state
        const sender = await Account.findOne({ deviceId: 'A' });
        expect(sender.balance).toBe(850); // Deducted exactly 150
        const receiver = await Account.findOne({ deviceId: 'B' });
        expect(receiver.balance).toBe(650); // Credited exactly 150
    });
});
