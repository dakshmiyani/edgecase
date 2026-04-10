import React, { useEffect, useState } from 'react';
import { verifyUser } from '../services/api';
import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react';

export default function VerifyButton({ onVerifySuccess }) {
  const [anonAadhaar] = useAnonAadhaar();
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Watch for the Anon Aadhaar SDK to finish generating the proof
    if (anonAadhaar.status === 'logged-in' && !isVerifying) {
      handleBackendVerification(anonAadhaar.anonAadhaarProofs);
    }
  }, [anonAadhaar, isVerifying]);

  const handleBackendVerification = async (proofs) => {
    setIsVerifying(true);
    setError('');
    
    try {
      console.log("Real Proof generated locally! Sending to Verifier backend...");
      
      // In the SDK, proofs usually contain both the proof data and the mapped public signals.
      // We pass the whole object to the backend, which depends on @anon-aadhaar/core.
      const backendResponse = await verifyUser(proofs);
      
      if (backendResponse.isVerified) {
        onVerifySuccess(backendResponse);
      } else {
        setError(backendResponse.message || "Cryptographic Verification failed");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <LogInWithAnonAadhaar nullifierSeed={1234} />
      
      {isVerifying && <p style={{ marginTop: '15px', color: 'var(--primary-color)' }}>Submitting ZK Proof to Blockchain / Verifier...</p>}
      {error && <p style={{ color: 'var(--danger)', marginTop: '12px' }}>{error}</p>}
      
      <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Your data never leaves your device. Only cryptographic proofs are sent to our servers.
      </p>
    </div>
  );
}
