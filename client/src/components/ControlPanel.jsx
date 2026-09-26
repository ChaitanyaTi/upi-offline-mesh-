import React, { useState } from 'react';
import axios from 'axios';
import { Send, Cpu } from 'lucide-react';

const ControlPanel = ({ accounts, refreshData, socket, nodes }) => {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterDefaults = async () => {
    setLoading(true);
    try {
      const defaultNodes = ['A', 'B', 'C', 'D', 'Bridge'];
      for (const id of defaultNodes) {
        // Skip if already exists
        if (!accounts.find(a => a.deviceId === id)) {
           await axios.post('http://localhost:5000/api/device/register', { deviceId: id });
        }
      }
      refreshData();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleSimulateTx = async () => {
    if (!sender || !receiver || !amount) return;
    setLoading(true);
    
    try {
      // 1. Generate encrypted packet via backend demo service
      const res = await axios.post('http://localhost:5000/api/demo/send', {
        senderId: sender,
        receiverId: receiver,
        amount
      });
      const packet = res.data;

      // 2. Simulate finding a path to bridge
      const path = [sender];
      const intermediates = nodes.filter(n => n.id !== sender && n.id !== receiver && !n.isBridge);
      if (intermediates.length > 0) {
          // Pick 1 random hop
          path.push(intermediates[Math.floor(Math.random() * intermediates.length)].id);
      }
      path.push('Bridge'); // Bridge receives the mesh packet

      // Add hops to packet for visualization/tracing
      packet.hops = path;

      // 3. Emit to mesh visualizer
      socket.emit('meshGossip', { tx: packet, path });

      setSender('');
      setReceiver('');
      setAmount('');
    } catch (error) {
      console.error('Failed to simulate transaction', error);
      alert('Failed to simulate transaction: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel">
      <h2 className="panel-title">Control Panel</h2>
      
      {accounts.length < 5 && (
        <button className="btn" onClick={handleRegisterDefaults} disabled={loading} style={{ marginBottom: '1.5rem' }}>
          <Cpu size={18} /> Bootstrap Network
        </button>
      )}

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-main)' }}>Offline Payment</h3>
        
        <div className="input-group">
          <label>Sender (Offline Node)</label>
          <select className="input-control" value={sender} onChange={e => setSender(e.target.value)}>
            <option value="">Select Sender...</option>
            {accounts.filter(a => a.deviceId !== 'Bridge').map(a => (
              <option key={a.deviceId} value={a.deviceId}>{a.deviceId}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Receiver (Offline Node)</label>
          <select className="input-control" value={receiver} onChange={e => setReceiver(e.target.value)}>
            <option value="">Select Receiver...</option>
            {accounts.filter(a => a.deviceId !== 'Bridge' && a.deviceId !== sender).map(a => (
              <option key={a.deviceId} value={a.deviceId}>{a.deviceId}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Amount (₹)</label>
          <input 
            type="number" 
            className="input-control" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 50"
          />
        </div>

        <button className="btn" onClick={handleSimulateTx} style={{ marginTop: '1rem' }}>
          <Send size={18} /> Initiate Mesh Gossip
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
