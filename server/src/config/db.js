const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        if (!uri) {
            mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
            uri = mongoServer.getUri();
            console.log('Started in-memory MongoDB replica set for transactions');
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
