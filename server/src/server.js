require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // For dev
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api', apiRoutes);

// Socket.io for Real-time Mesh Visualization Updates
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Client can emit mesh events to be broadcasted to UI
    socket.on('meshGossip', (data) => {
        io.emit('meshGossipVisual', data);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await connectRedis(); // Initialize redis for pub/sub if needed later
    
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = { app, server, io }; // For testing
