// Simulates mesh devices creating and propagating transactions
// In this MERN implementation, this is largely visualised on the client side
// However, this service can be used for load testing backend sync

const axios = require('axios');
const CryptoService = require('../crypto/cryptoService');

class MeshSimulator {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.devices = [];
    }

    async registerDevices(count) {
        for (let i = 0; i < count; i++) {
            const res = await axios.post(`${this.apiUrl}/api/device/register`, {
                deviceId: `SimDevice-${i}`
            });
            this.devices.push(res.data);
        }
    }
}

module.exports = MeshSimulator;
