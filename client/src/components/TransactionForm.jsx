import React, { useState } from 'react';
import { makeTransaction } from '../services/api';

export default function TransactionForm({ userId, onTransactionSuccess }) {
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');

    try {
      const response = await makeTransaction({
        userId,
        amount,
        toAddress
      });

      if (response.status === 'success') {
        setStatusMsg('Transaction Sent!');
        onTransactionSuccess(response.transaction);
        setAmount('');
        setToAddress('');
      } else {
        setStatusMsg(response.message || 'Error occurred');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Network Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
      <div className="input-group">
        <label>Amount (ETH)</label>
        <input 
          type="number" 
          step="0.01" 
          required 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="0.0"
        />
      </div>
      
      <div className="input-group">
        <label>Recipient Address</label>
        <input 
          type="text" 
          required 
          value={toAddress} 
          onChange={(e) => setToAddress(e.target.value)} 
          placeholder="0x..."
        />
      </div>

      <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
        {loading ? 'Sending ZK Transaction...' : 'Send Transaction'}
      </button>

      {statusMsg && (
        <p style={{ marginTop: '12px', textAlign: 'center', color: statusMsg.includes('Sent') ? 'var(--primary-color)' : 'var(--danger)' }}>
          {statusMsg}
        </p>
      )}
    </form>
  );
}
