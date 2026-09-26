import React from 'react';

const Ledger = ({ transactions }) => {
  return (
    <div className="glass-panel">
      <h2 className="panel-title">Global Settlement Ledger</h2>
      <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tx ID</th>
              <th>Path</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx._id || tx.txId}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{tx.txId.substring(0, 8)}...</td>
                <td>{tx.senderId} → {tx.receiverId}</td>
                <td style={{ fontWeight: 600 }}>₹{tx.amount}</td>
                <td>
                  <span className={`badge ${tx.status.toLowerCase()}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No transactions yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ledger;
