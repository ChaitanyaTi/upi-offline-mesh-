const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const CryptoService = require('../crypto/cryptoService');
const { acquireLock, releaseLock } = require('../config/redis');

class SettlementService {
    static async settleTransaction(txData) {
        const { txId, senderId, receiverId, amount, nonce, signature, hops, packetHash } = txData;

        // Deduplication using in-memory lock
        if (!acquireLock(`tx:${txId}`)) {
            throw new Error('Transaction is currently being processed');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Check if transaction already exists
            const existingTx = await Transaction.findOne({ txId }).session(session);
            if (existingTx) {
                throw new Error('Transaction already settled or pending');
            }

            // Get sender and receiver accounts
            const sender = await Account.findOne({ deviceId: senderId }).session(session);
            const receiver = await Account.findOne({ deviceId: receiverId }).session(session);

            if (!sender) throw new Error('Sender account not found');
            if (!receiver) throw new Error('Receiver account not found');

            // Verify signature (or accept hybrid-encrypted from ingestion pipeline)
            if (signature !== 'hybrid-encrypted') {
                const dataToVerify = `${txId}:${senderId}:${receiverId}:${amount}:${nonce}`;
                const isValid = CryptoService.verifySignature(sender.publicKey, dataToVerify, signature);
                if (!isValid) {
                    throw new Error('Invalid cryptographic signature');
                }
            }

            // Prevent Replay Attacks via Nonce
            if (nonce <= sender.nonce) {
                throw new Error('Invalid nonce. Transaction may be a replay attack.');
            }

            // Check Balance
            if (sender.balance < amount) {
                throw new Error('Insufficient balance');
            }

            // Execute Settlement
            sender.balance -= amount;
            sender.nonce = nonce; // update nonce
            receiver.balance += amount;

            await sender.save({ session });
            await receiver.save({ session });

            // Create Transaction record
            const newTx = new Transaction({
                txId,
                senderId,
                receiverId,
                amount,
                nonce,
                signature,
                status: 'SETTLED',
                hops,
                packetHash
            });

            await newTx.save({ session });

            await session.commitTransaction();
            session.endSession();
            releaseLock(`tx:${txId}`);
            
            return newTx;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            releaseLock(`tx:${txId}`);
            
            // Log failed transaction if possible
            if (txData && txData.txId) {
                try {
                    await Transaction.create({
                        txId: txData.txId,
                        senderId: txData.senderId || 'unknown',
                        receiverId: txData.receiverId || 'unknown',
                        amount: txData.amount || 0,
                        nonce: txData.nonce || 0,
                        signature: txData.signature || 'invalid',
                        status: 'FAILED',
                        errorReason: error.message,
                        hops: txData.hops || []
                    });
                } catch (e) {
                    console.error('Could not log failed transaction:', e.message);
                }
            }

            throw error;
        }
    }
}

module.exports = SettlementService;
