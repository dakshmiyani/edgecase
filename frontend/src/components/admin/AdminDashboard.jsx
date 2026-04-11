import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import SystemHealth from './SystemHealth';
import AnomalyAlerts from './AnomalyAlerts';
import UserManagement from './UserManagement';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Monitor, FileText, ChevronLeft, ChevronRight, Loader2, Building, Terminal, CreditCard } from 'lucide-react';
import ApiKeyManager from '../dashboard/ApiKeyManager';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'users' | 'transactions' | 'developer'
  const [logs, setLogs] = useState([]);
  const [txs, setTxs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [txPagination, setTxPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [logLoading, setLogLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  const fetchLogs = async (page = 1) => {
    setLogLoading(true);
    try {
      const { data } = await api.get('/admin/logs', { params: { page, limit: 20 } });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch admin logs:', err);
    } finally {
      setLogLoading(false);
    }
  };

  const fetchTransactions = async (page = 1) => {
    setTxLoading(true);
    try {
      const { data } = await api.get('/merchant/transactions/org', { params: { page, limit: 20 } });
      setTxs(data.transactions);
      setTxPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch org transactions for admin:', err);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchTransactions();
  }, []);

  const actionColors = {
    READ: 'default',
    MAP: 'secondary',
    REVOKE: 'destructive',
    LOGIN: 'success',
    REGISTER: 'success',
    DELETE: 'warning',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <Monitor className="w-6 h-6 text-violet-400" />
            Brand Admin Dashboard
          </h2>
          <p className="text-sm text-white/40">System health, anomalies, and audit trail</p>
        </div>
        {user?.org_token_id && (
          <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
            <Building className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono text-violet-300">Brand: {user.org_token_id}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {['monitor', 'users', 'transactions', 'developer'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs px-4 py-2 rounded-lg font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'users' ? (
        <UserManagement />
      ) : activeTab === 'transactions' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Organization Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-400" />
                    </TableCell>
                  </TableRow>
                ) : txs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-white/30">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  txs.map((tx) => (
                    <TableRow key={tx.txn_id}>
                      <TableCell className="font-mono text-[10px] text-white/70">{tx.txn_id}</TableCell>
                      <TableCell>
                        <p className="text-xs font-medium text-white">{tx.customer_name}</p>
                        <p className="text-[10px] text-white/40 font-mono">{tx.user_token_id}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-[11px] text-white/60">{tx.customer_email}</p>
                        <p className="text-[10px] text-white/30">{tx.customer_phone}</p>
                      </TableCell>
                      <TableCell className="font-medium text-white">₹{tx.amount?.toLocaleString() || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'success' : 'outline'} className="text-[10px] uppercase">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-white/30">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : activeTab === 'developer' ? (
        <ApiKeyManager />
      ) : (
        <>
          {/* System Health */}
          <SystemHealth />

          {/* Anomaly Alerts */}
          <AnomalyAlerts />

          {/* System-Wide Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            System Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User Token</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-400" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-white/30">
                    No events recorded
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-[11px] text-white/40">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.user_token}</TableCell>
                    <TableCell className="font-mono text-xs text-white/50">{log.merchant_token || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={actionColors[log.action] || 'default'} className="text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(log.fields || []).map((f, j) => (
                          <Badge key={j} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-white/30">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  onClick={() => fetchLogs(pagination.page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
