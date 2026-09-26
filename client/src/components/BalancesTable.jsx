import React from 'react';

const BalancesTable = ({ accounts }) => {
  return (
    <div className="glass-panel">
      <h2 className="panel-title">Node Balances</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Balance (₹)</th>
              <th>Nonce</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.deviceId}>
                <td style={{ fontWeight: 600 }}>{acc.deviceId}</td>
                <td style={{ color: 'var(--success)' }}>₹{acc.balance}</td>
                <td>{acc.nonce}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No accounts registered</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BalancesTable;
