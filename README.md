# Offline UPI Mesh Payment System

A proof-of-concept system demonstrating how UPI (Unified Payments Interface) payments can be processed in an offline environment using a device-to-device mesh network.

## 🌟 Overview

In areas with low or no internet connectivity, traditional UPI transactions fail. This project simulates an "Offline UPI" architecture where:
1. **Sender** creates and encrypts a transaction packet locally.
2. The packet is broadcasted via a **Mesh Network** (e.g., via Bluetooth Low Energy or Wi-Fi Direct in a real-world scenario).
3. The packet hops between offline devices until it reaches a **Bridge Node** (a device that currently has internet access).
4. The Bridge Node **ingests** the packet to the central backend server.
5. The backend validates, decrypts, and **settles** the transaction securely.

## 🏗️ Architecture

The project consists of three main components:

- **Client (`/client`)**: A React (Vite) dashboard that visualizes the mesh network, tracks real-time account balances, and displays the global transaction ledger using Socket.io.
- **Server (`/server`)**: A Node.js and Express backend responsible for:
  - Device Registration & Key generation.
  - Bridge Ingestion (receiving packets from the mesh).
  - Hybrid Cryptography (encrypting/decrypting payloads securely).
  - Settlement (updating account balances).
  - Idempotency (preventing replay attacks using Redis).
- **Infrastructure**: MongoDB (for persistent storage of Accounts and Transactions) and Redis (for idempotency checks) orchestrated via Docker Compose.

## 🚀 Key Features

- **Hybrid Cryptography**: Simulates secure end-to-end encryption of transaction payloads so intermediary nodes cannot read the data.
- **Idempotency Service**: Ensures that even if a mesh network delivers the same transaction packet multiple times (through different routes), it is only processed and settled once.
- **Mesh Simulator**: A visual and logical representation of packets hopping through nodes.
- **Real-Time Ledger**: Live updates of settled transactions on the dashboard using WebSockets.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS (or Vanilla CSS), Socket.io-client, Axios, Lucide React.
- **Backend**: Node.js, Express, Mongoose, Socket.io, Redis.
- **Database**: MongoDB.
- **Containerization**: Docker & Docker Compose.

## ⚙️ Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Docker](https://www.docker.com/) and Docker Compose
- Git

### 1. Start Infrastructure (Database & Redis)
From the root of the project, start the MongoDB and Redis containers:
```bash
docker-compose up -d
```

### 2. Start the Backend Server
Open a new terminal and run:
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:3000`.

### 3. Start the Frontend Client
Open another terminal and run:
```bash
cd client
npm install
npm run dev
```
The Vite development server will start (usually on `http://localhost:5173`). Open this URL in your browser to view the dashboard.

## 📂 Project Structure

```
upi-offline-mesh/
│
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # UI Components (Ledger, Visualizer, etc.)
│   │   ├── App.jsx         # Main Layout
│   │   └── index.css       # Styles
│   └── package.json        
│
├── server/                 # Backend Node.js Server
│   ├── src/
│   │   ├── config/         # DB and Redis connections
│   │   ├── crypto/         # Encryption/Decryption logic
│   │   ├── models/         # Mongoose Schemas (Account, Transaction)
│   │   ├── routes/         # Express API Routes (api.js)
│   │   ├── services/       # Core Business Logic (Settlement, Idempotency)
│   │   └── server.js       # Entry point
│   ├── test/               # Jest tests
│   └── package.json
│
├── docker-compose.yml      # Infrastructure configuration
└── README.md               # Project documentation
```

## 🔐 Security Considerations
- **Replay Attacks**: Prevented using a combination of `nonce` values and a Redis-backed Idempotency Service holding `packetId`s.
- **Data Privacy**: Transactions are encrypted by the sender and only decrypted by the server; bridge nodes cannot read the amount or receiver details.

---
*This is a Proof of Concept project meant for demonstration and educational purposes.*
