import React, { useEffect, useState } from 'react';
import { useMerchantStore } from '../../store/merchantStore';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Users, CreditCard, TrendingUp, Shield, Search, ChevronRight,
  Loader2, RefreshCw, Download, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, AlertCircle, Lock, BarChart3, Filter
} from 'lucide-react';
import TransactionView from './TransactionView';
import MerchantMap from './MerchantMap';
import ApiKeyManager from '../dashboard/ApiKeyManager';

const STATUS_COLOR = {
  SUCCESS: 'text-emerald-400',
  FAILED: 'text-red-400',
  PENDING: 'text-amber-400',
  INITIATED: 'text-blue-400',
  BLOCKED: 'text-red-500',
};

const STAT_ICON = {
  users: Users,
  revenue: CreditCard,
  growth: TrendingUp,
  security: Shield,
};

function StatCard({ icon: Icon, label, value, sub, color = 'violet' }) {
  const colors = {
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs text-white/30 font-mono">{sub}</span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          <p className="text-xs text-white/40 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MerchantDashboard() {
  const { 
    mappedUsers, pagination, rateLimit, transactions, 
    orgTransactions, orgTxPagination, 
    fetchMappedUsers, fetchTransactions, fetchOrgTransactions, 
    isLoading 
  } = useMerchantStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('customers'); // customers | org-transactions | map-user | developer

  useEffect(() => { 
    fetchMappedUsers(); 
    fetchOrgTransactions();
  }, [fetchMappedUsers, fetchOrgTransactions]);

  const filtered = mappedUsers.filter(u =>
    u.user_token_id?.toLowerCase().includes(search.toLowerCase()) ||
    u.merchant_user_id?.toLowerCase().includes(search.toLowerCase())
  );

  const rateUsed = Math.round(((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100);

  if (selectedUser) {
    return <TransactionView userToken={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Merchant Portal</h2>
          <p className="text-sm text-white/40 mt-0.5">Customer intelligence & encrypted transaction data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => fetchMappedUsers()}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Mapped Customers" value={pagination.total} sub="Total" color="violet" />
        <StatCard icon={CreditCard} label="Transactions Visible" value={transactions.length || '—'} sub="Loaded" color="cyan" />
        <StatCard icon={Lock} label="API Calls Used" value={`${rateLimit.limit - rateLimit.remaining}/${rateLimit.limit}`} sub={`${rateUsed}%`} color="amber" />
        <StatCard icon={Shield} label="Encryption" value="AES-256" sub="End-to-end" color="emerald" />
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {[
          { id: 'customers', label: 'My Customers' },
          { id: 'org-transactions', label: 'All Transactions' },
          { id: 'map-user', label: 'Add Customer' },
          { id: 'developer', label: 'Developer' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'map-user' && (
        <Card>
          <CardContent className="pt-6">
            <MerchantMap onMapped={() => { fetchMappedUsers(); setActiveTab('customers'); }} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'developer' && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <ApiKeyManager />
          </CardContent>
        </Card>
      )}
      {activeTab === 'org-transactions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_1fr_auto] px-5 py-3 bg-white/5 border-b border-white/10 text-xs font-medium text-white/40 uppercase tracking-wider">
              <span>Transaction ID</span>
              <span>Customer</span>
              <span>Contact</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {orgTransactions.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <p>No transactions found for this organization</p>
              </div>
            ) : (
              orgTransactions.map((tx, i) => (
                <div key={tx.txn_id} className={`grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_1fr_auto] items-center px-5 py-4 hover:bg-white/5 transition-colors ${i !== orgTransactions.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-[10px] font-mono text-white/70 truncate">{tx.txn_id}</span>
                  <div>
                    <p className="text-sm font-medium text-white truncate">{tx.customer_name}</p>
                    <p className="text-[10px] text-white/40 font-mono truncate">{tx.user_token_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 truncate">{tx.customer_email}</p>
                    <p className="text-[10px] text-white/30 truncate">{tx.customer_phone}</p>
                  </div>
                  <span className="text-sm font-bold text-white">₹{tx.amount?.toLocaleString() || '—'}</span>
                  <Badge variant={tx.status === 'completed' ? 'success' : 'outline'} className="w-fit text-[10px] uppercase">
                    {tx.status}
                  </Badge>
                  <span className="text-xs text-white/30">{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* ─── Search ─── */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by token or internal ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* ─── Customer Table (Razorpay-style) ─── */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] px-5 py-3 bg-white/5 border-b border-white/10 text-xs font-medium text-white/40 uppercase tracking-wider">
              <span>Customer</span>
              <span>Contact</span>
              <span>Internal ID</span>
              <span>Linked</span>
              <span>Action</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{search ? 'No matching customers' : 'No customers mapped yet'}</p>
                <p className="text-xs mt-1 text-white/20">
                  {!search && 'Use "Add Customer" tab to link your first user'}
                </p>
              </div>
            ) : (
              filtered.map((user, i) => (
                <CustomerRow
                  key={user.user_token_id}
                  user={user}
                  isLast={i === filtered.length - 1}
                  onView={() => {
                    setSelectedUser(user.user_token_id);
                    fetchTransactions(user.user_token_id);
                  }}
                />
              ))
            )}
          </div>

          {/* ─── Pagination row ─── */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between text-xs text-white/30 px-1">
              <span>Showing {filtered.length} of {pagination.total} customers</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> All amounts decrypted server-side
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomerRow({ user, onView, isLast }) {
  const since = user.linked_at
    ? new Date(user.linked_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div
      className={`grid grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] items-center px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group ${!isLast ? 'border-b border-white/5' : ''}`}
      onClick={onView}
    >
      {/* Customer identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-violet-400">
            {(user.name?.[0] || user.user_token_id?.slice(4, 6)).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{user.name || 'Anonymous'}</p>
          <p className="text-[10px] font-mono text-white/30 truncate">{user.user_token_id}</p>
        </div>
      </div>

      {/* Contact info */}
      <div className="min-w-0">
        <p className="text-[11px] text-white/60 truncate">{user.email || '—'}</p>
        <p className="text-[10px] text-white/30">{user.phone || '—'}</p>
      </div>

      {/* Internal ID */}
      <div>
        <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-1 rounded-md">
          {user.merchant_user_id || '—'}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-white/20" />
        <span className="text-xs text-white/40">{since}</span>
      </div>

      {/* CTA */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onView}
        className="text-xs gap-1 text-violet-400 hover:text-violet-300 group-hover:bg-violet-500/10"
      >
        View Transactions
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
