import React, { useEffect, useState } from 'react';
import { useMerchantStore } from '../../store/merchantStore';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ArrowLeft, Receipt, RefreshCw, Download, Lock, ShieldCheck,
  Loader2, CreditCard, TrendingUp, Calendar, CheckCircle2,
  XCircle, Clock, AlertOctagon, ExternalLink, Copy, Check
} from 'lucide-react';

const STATUS_META = {
  SUCCESS:  { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Success' },
  FAILED:   { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         label: 'Failed' },
  PENDING:  { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     label: 'Pending' },
  INITIATED:{ icon: Clock,        color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       label: 'Initiated' },
  BLOCKED:  { icon: AlertOctagon, color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/20',         label: 'Blocked' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status?.toUpperCase()] || STATUS_META.PENDING;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-white/20 hover:text-white/60 transition-colors">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function TransactionView({ userToken, onBack }) {
  const { transactions, txPagination, fetchTransactions, createTransaction, isLoading } = useMerchantStore();
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (userToken) fetchTransactions(userToken);
  }, [userToken, fetchTransactions]);

  const handleTestTransaction = async (amt, label) => {
    try {
      setIsCreating(true);
      const res = await createTransaction(userToken, amt, 'Retail');
      alert(`✅ ${label}\nAI Risk: ${res.fraud_info?.risk || 'N/A'}\nScore: ${res.fraud_info?.score || 'N/A'}`);
    } catch (err) {
      alert(`🚫 ${err.response?.data?.error || err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Summary stats
  const totalAmount = transactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const successCount = transactions.filter(t => t.status?.toUpperCase() === 'SUCCESS').length;
  const latestTxn = transactions[0];

  if (selectedTxn) {
    return <TransactionDetail txn={selectedTxn} onBack={() => setSelectedTxn(null)} userToken={userToken} />;
  }

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex items-start gap-4">
        <button onClick={onBack} className="mt-1 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Transactions</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-white/40">{userToken}</span>
            <CopyButton text={userToken} />
            <span className="text-white/20">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <Lock className="w-3 h-3" /> E2E Encrypted
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => fetchTransactions(userToken)}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
          <Button
            variant="outline" size="sm"
            className="text-xs gap-1.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            onClick={() => handleTestTransaction(99, 'Low-risk test')}
            disabled={isCreating}
          >
            Test ₹99
          </Button>
          <Button
            variant="destructive" size="sm"
            className="text-xs gap-1.5"
            onClick={() => handleTestTransaction(6000, 'High-risk test')}
            disabled={isCreating}
          >
            Test ₹6,000
          </Button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-white/40 mb-1">Total Volume</p>
            <p className="text-xl font-bold text-white font-mono">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Decrypted for you
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-white/40 mb-1">Total Transactions</p>
            <p className="text-xl font-bold text-white font-mono">{transactions.length}</p>
            <p className="text-xs text-white/30 mt-0.5">{successCount} successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-white/40 mb-1">Last Activity</p>
            <p className="text-sm font-semibold text-white">
              {latestTxn ? new Date(latestTxn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
            </p>
            {latestTxn && <StatusBadge status={latestTxn.status} />}
          </CardContent>
        </Card>
      </div>

      {/* ─── Transaction List ─── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-white/5 border-b border-white/10 text-xs font-medium text-white/40 uppercase tracking-wider">
          <span className="w-24">Txn ID</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Date</span>
          <span></span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1 text-white/20">Use the test buttons above to create one</p>
          </div>
        ) : (
          transactions.map((txn, i) => (
            <TransactionRow
              key={txn.txn_id || i}
              txn={txn}
              isLast={i === transactions.length - 1}
              onClick={() => setSelectedTxn(txn)}
            />
          ))
        )}
      </div>

      {/* ─── Encryption notice ─── */}
      <div className="flex items-center gap-2 px-1 text-xs text-white/20">
        <Lock className="w-3.5 h-3.5 text-violet-400/50" />
        Amounts are AES-256-GCM encrypted at rest. Only your authenticated session can decrypt them.
        Raw DB shows ciphertext only.
      </div>
    </div>
  );
}

function TransactionRow({ txn, onClick, isLast }) {
  const shortId = txn.txn_id ? `...${txn.txn_id.slice(-8)}` : '—';
  const amount = txn.amount != null ? `₹${parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
  const date = txn.created_at ? new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

  return (
    <div
      className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group ${!isLast ? 'border-b border-white/5' : ''}`}
      onClick={onClick}
    >
      <span className="font-mono text-xs text-white/40 w-24">{shortId}</span>
      <span className="font-mono font-semibold text-white text-sm">{amount}</span>
      <StatusBadge status={txn.status} />
      <span className="text-xs text-white/40">{date}</span>
      <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-violet-400 transition-colors" />
    </div>
  );
}

function TransactionDetail({ txn, onBack, userToken }) {
  const id = txn.txn_id || '—';
  const amount = txn.amount != null ? parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—';
  const date = txn.created_at ? new Date(txn.created_at).toLocaleString('en-IN') : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">Transaction Detail</h2>
          <p className="text-xs text-white/40 font-mono">{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Payment Info</p>
            <DetailRow label="Amount" value={`₹${amount}`} highlight />
            <DetailRow label="Status"><StatusBadge status={txn.status} /></DetailRow>
            <DetailRow label="Date" value={date} />
            <DetailRow label="Gateway Order" value={txn.gateway_order_id || 'Processing...'} mono />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-4">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Security Info</p>
            <DetailRow label="Customer Token" value={userToken} mono copyable />
            <DetailRow label="Txn ID" value={id} mono copyable />
            <DetailRow label="Encryption" value="AES-256-GCM" />
            <DetailRow label="Data Access" value="Merchant-authorized" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight, mono, copyable, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-white/40 flex-shrink-0">{label}</span>
      {children ? children : (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-sm truncate ${highlight ? 'font-bold text-white' : mono ? 'font-mono text-white/60 text-xs' : 'text-white/70'}`}>
            {value}
          </span>
          {copyable && value && <CopyButton text={value} />}
        </div>
      )}
    </div>
  );
}
