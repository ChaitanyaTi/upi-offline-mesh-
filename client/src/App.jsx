import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Activity } from 'lucide-react';

import MeshVisualizer from './components/MeshVisualizer';
import BalancesTable from './components/BalancesTable';
import Ledger from './components/Ledger';
import ControlPanel from './components/ControlPanel';

const socket = io('http://localhost:5000');

function App() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [nodes, setNodes] = useState([]);

  const fetchData = async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        axios.get('http://localhost:5000/api/accounts'),
        axios.get('http://localhost:5000/api/transactions')
      ]);
      setAccounts(accRes.data);
      setTransactions(txRes.data);

      // Generate visual nodes layout based on accounts
      const newNodes = accRes.data.map((acc, index) => {
        const isBridge = acc.deviceId === 'Bridge';
        return {
          id: acc.deviceId,
          isBridge,
          x: isBridge ? 80 : 20 + Math.random() * 40,
          y: isBridge ? 50 : 20 + Math.random() * 60
        };
      });
      setNodes(newNodes);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('transactionSettled', (tx) => {
      fetchData(); // Refresh all on new settlement
    });

    return () => {
      socket.off('transactionSettled');
    };
  }, []);

  const handleReachBridge = async (packet) => {
    // When the packet visually reaches the bridge, the bridge calls /api/bridge/ingest
    try {
      await axios.post('http://localhost:5000/api/bridge/ingest', packet);
      // The socket will trigger fetchData if settled successfully, 
      // but let's refresh anyway in case it failed
      fetchData();
    } catch (error) {
      console.error("Sync error:", error);
      fetchData();
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1><Activity color="var(--accent-blue)" size={32} /> Offline UPI Mesh</h1>
        <div style={{ color: 'var(--text-muted)' }}>Deferred Settlement Architecture</div>
      </header>

      <div className="grid-layout">
        <div className="col-main">
          <MeshVisualizer socket={socket} nodes={nodes} onReachBridge={handleReachBridge} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <BalancesTable accounts={accounts} />
            <Ledger transactions={transactions} />
          </div>
        </div>

        <div>
          <ControlPanel accounts={accounts} refreshData={fetchData} socket={socket} nodes={nodes} />
        </div>
      </div>
    </div>
  );
}

export default App;
