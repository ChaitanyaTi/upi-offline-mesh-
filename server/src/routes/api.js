const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const SettlementService = require('../services/settlementService');
const CryptoService = require('../crypto/cryptoService');
const hybridCryptoService = require('../crypto/hybridCryptoService');
const BridgeIngestionService = require('../services/bridgeIngestionService');

// Register a new device with a public key
router.post('/device/register', async (req, res) => {
    try {
        const { deviceId } = req.body;
        // In real world, device sends its public key. Here we generate it for simulation.
        const { publicKey, privateKey } = CryptoService.generateKeyPair();

        const account = new Account({
            deviceId,
            publicKey,
            balance: 1000,
            nonce: 0
        });

        await account.save();

        res.status(201).json({
            message: 'Device registered',
            account,
            privateKey // Sending private key back ONLY for simulation purposes
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Bridge node endpoint to ingest mesh transactions
router.post('/bridge/ingest', async (req, res) => {
    try {
        const { packetId, ttl, createdAt, ciphertext, hops } = req.body;
        const result = await BridgeIngestionService.ingest(req.body);
        
        if (result.outcome === 'SETTLED') {
            // Fetch transaction to emit
            const settledTx = await Transaction.findById(result.transactionId);
            req.app.get('io').emit('transactionSettled', settledTx);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simulate sender phone encrypting a packet
router.post('/demo/send', async (req, res) => {
    try {
        const { senderId, receiverId, amount } = req.body;
        const account = await Account.findOne({ deviceId: senderId });
        if (!account) return res.status(404).json({ error: 'Sender not found' });

        const payload = {
            txId: `tx-${Date.now()}`,
            senderId,
            receiverId,
            amount: Number(amount),
            nonce: account.nonce + 1,
            time: Date.now()
        };

        const ciphertext = hybridCryptoService.encrypt(payload);
        
        res.json({
            packetId: payload.txId,
            ttl: 5,
            createdAt: payload.time,
            ciphertext
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all accounts (for visualizer)
router.get('/accounts', async (req, res) => {
    const accounts = await Account.find({}).select('-publicKey');
    res.json(accounts);
});

// Get transactions (for ledger)
router.get('/transactions', async (req, res) => {
    const transactions = await Transaction.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(transactions);
});

module.exports = router;
