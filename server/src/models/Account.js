const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true },
    balance: { type: Number, required: true, default: 1000 },
    nonce: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
