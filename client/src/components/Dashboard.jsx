import React, { useState } from 'react';
import TransactionForm from './TransactionForm';

export default function Dashboard({ userId }) {
  const [transactions, setTransactions] = useState([]);

  const handleNewTransaction = (tx) => {
    setTransactions([tx, ...transactions]);
  };

  return (
    <div className="glass-panel animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '20px' }}>
        <h2>Identity Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge">User is 18+ ✅</span>
          <span className="badge">Valid Aadhaar holder ✅</span>
          <span className="badge" style={{ borderColor: 'rgba(0, 150, 255, 0.5)', color: '#00b8ff' }}>Verified via ZKP</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '10px' }}>UserID: <strong style={{ color: '#fff' }}>{userId}</strong></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Left Col: Form */}
        <div>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Make a completely anonymous transaction</h3>
          <TransactionForm userId={userId} onTransactionSuccess={handleNewTransaction} />
        </div>

        {/* Right Col: tx list */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
          <h3 style={{ marginBottom: '20px' }}>Transaction History</h3>
          
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {transactions.map(tx => (
                <li key={tx.txId} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>{tx.amount} ETH</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx.txId}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                    To: {tx.toAddress}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
