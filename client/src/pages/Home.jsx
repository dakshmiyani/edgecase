import React, { useState } from 'react';
import VerifyButton from '../components/VerifyButton';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [userState, setUserState] = useState({
    isVerified: false,
    userId: null,
  });

  const handleVerificationSuccess = (data) => {
    setUserState({
      isVerified: true,
      userId: data.userId,
    });
  };

  return (
    <div className="container animate-in">
      <header className="header">
        <h1>zkTransact</h1>
        <p>Zero-Knowledge Identity Proving. Never share your Aadhaar again.</p>
      </header>

      <main>
        {!userState.isVerified ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
             <h2 style={{ marginBottom: '20px' }}>Prove Your Identity Securely</h2>
             <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                We use zk-SNARKs (Anon Aadhaar) to verify your age and citizenship without ever seeing your name, date of birth, or Aadhaar number.
             </p>
             <VerifyButton onVerifySuccess={handleVerificationSuccess} />
          </div>
        ) : (
          <Dashboard userId={userState.userId} />
        )}
      </main>
    </div>
  );
}
