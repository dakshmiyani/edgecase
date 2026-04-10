import React, { useState, useEffect } from 'react';
import { createTransaction, verifyTransaction } from '../../services/transaction.js';
import { CreditCard, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function PaymentTerminal() {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState(" ");
  const [status, setStatus] = useState('IDLE'); // IDLE, CREATING, POLLING, AWAITING_PAYMENT, SUCCESS, BLOCKED, FAILED
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationData, setVerificationData] = useState(null);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!amount || amount <= 0) return;
    setStatus('CREATING');
    setErrorMsg('');
    setVerificationData(null);

    try {
      // 1. Transaction Creation (Hits Idempotency Gate)
      const res = await createTransaction({
        user_token_id: user?.user_token_id || 'usr_WyAF_nf-bHid', 
        amount,
        decision: 'ALLOW',
        fraud_score: 5
      });

      const txnId = res.data.txn_id;
      setStatus('POLLING');

      // 2. Poll for Order ID from BullMQ async worker
      const pollTimer = setInterval(async () => {
        try {
          const verifyRes = await verifyTransaction(txnId);

          if (verifyRes.data.status === 'PENDING' && verifyRes.data.gateway_order_id) {
            clearInterval(pollTimer);
            setStatus('AWAITING_PAYMENT');
            setVerificationData(verifyRes.data);
            launchRazorpay(verifyRes.data.gateway_order_id, txnId);
          } else if (verifyRes.data.status === 'FAILED' || verifyRes.data.status === 'BLOCKED') {
            clearInterval(pollTimer);
            setStatus(verifyRes.data.status);
          }
        } catch (pollErr) {
          console.error("Polling error", pollErr);
        }
      }, 2000);

      // Stop polling after 30s timeout
      setTimeout(() => {
        clearInterval(pollTimer);
        if (status === 'POLLING') {
           setStatus('FAILED');
           setErrorMsg('Gateway Timeout');
        }
      }, 30000);

    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.status || 'FAILED');
      setErrorMsg(err.response?.data?.error || 'Payment initialization failed');
    }
  };

  const launchRazorpay = (order_id, txn_id) => {
    if (!window.Razorpay) {
      setErrorMsg("Razorpay SDK not loaded");
      setStatus('FAILED');
      return;
    }

    const options = {
      key: "rzp_test_SbjDhLTcwnJEXx", // Actual dev key from server
      amount: amount * 100, // Paise
      currency: "INR",
      name: "SecureAiPay Layer 5",
      description: "Transaction Execution Processing",
      order_id: order_id,
      handler: function (response) {
        // Razorpay success hook. Webhook handles DB async, but we can optimistically update UI here.
        setStatus('SUCCESS');
      },
      prefill: {
        name: user?.name || "Test User",
        email: user?.email || "test@secureaipay.com",
      },
      theme: { color: "#10B981" },
      modal: {
        ondismiss: function() {
          setStatus('IDLE'); // User closed window natively
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      setStatus('FAILED');
      setErrorMsg(response.error.description);
    });
    rzp.open();
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5" />
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Payment Terminal</h3>
              <p className="text-white/50 text-xs">Layer 5 • Execution Sync</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'POLLING' || status === 'CREATING' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'POLLING' || status === 'CREATING' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">Secured</span>
          </div>
        </div>

        <div className="space-y-6">
          {(status === 'IDLE' || status === 'FAILED') && (
            <>
              {status === 'FAILED' && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{errorMsg}</p>
                </div>
              )}
              
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-2 block font-medium">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-medium">₹</span>
                  <input
                    type="number"
                    value={amount}
                    placeholder='Enter the Amount'
              //reomve scroll or up down arrows
                 
                   
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white font-mono outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full relative overflow-hidden group bg-white text-black font-semibold rounded-xl py-4 hover:bg-gray-100 transition-colors"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Execute Secured Transfer
                </span>
              </button>
            </>
          )}

          {(status === 'CREATING' || status === 'POLLING') && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm text-white font-medium">
                  {status === 'CREATING' ? 'Initiating Gateways...' : 'Awaiting BullMQ Worker...'}
                </p>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  {status === 'POLLING' ? 'Polling Idempotent Gateway ID' : 'Validating Layer 3 Rules'}
                </p>
              </div>
            </div>
          )}

          {status === 'AWAITING_PAYMENT' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm text-white font-medium">Please Complete Checkout</p>
                <p className="text-xs text-white/40 mt-1 font-mono">Gateway Initialized • Order: {verificationData?.gateway_order_id?.substring(0, 10)}...</p>
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-lg text-white font-bold">Transfer Complete</p>
                <p className="text-sm text-emerald-400 mt-1">Exactly-Once Orchestration Successful</p>
              </div>
              <button
                onClick={() => setStatus('IDLE')}
                className="mt-4 text-xs text-white/50 hover:text-white transition-colors underline underline-offset-4"
              >
                Start New Transfer
              </button>
            </div>
          )}

          {status === 'BLOCKED' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
               <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-lg text-white font-bold">Transfer Blocked</p>
                <p className="text-sm text-red-400 mt-1 flex flex-col gap-1">
                  <span>Rejected by Real-Time Neural Net</span>
                  <span className="text-xs text-white/40 font-mono">Layer 3 Intercepted</span>
                </p>
              </div>
              <button
                onClick={() => setStatus('IDLE')}
                className="mt-4 text-xs text-white/50 hover:text-white transition-colors underline underline-offset-4"
              >
                Acknowledge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
