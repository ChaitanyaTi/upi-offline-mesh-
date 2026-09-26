const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    txId: { type: String, required: true, unique: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    amount: { type: Number, required: true },
    nonce: { type: Number, required: true },
    signature: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'SETTLED', 'FAILED'], default: 'PENDING' },
    hops: [{ type: String }], // Array of deviceIds that relayed this transaction
    errorReason: { type: String },
    packetHash: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
