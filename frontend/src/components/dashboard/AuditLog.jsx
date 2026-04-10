import React, { useEffect, useState } from 'react';
import { usePrivacyStore } from '../../store/privacyStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Input } from '../ui/input';
import { FileText, Download, MessageSquare, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { generateAuditCSV, downloadCSV } from '../../lib/csv-export';

export default function AuditLog() {
  const { auditLogs, auditPagination, fetchAuditLogs, explainLog, isLoading } = usePrivacyStore();
  const [merchantFilter, setMerchantFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [explanation, setExplanation] = useState(null);
  const [explainLoading, setExplainLoading] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleFilter = () => {
    fetchAuditLogs({
      page: 1,
      merchant: merchantFilter || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });
  };

  const handleExplain = async (logId) => {
    setExplainLoading(logId);
    const result = await explainLog(logId);
    setExplanation(result);
    setExplainLoading(null);
  };

  const handleExport = () => {
    const csv = generateAuditCSV(auditLogs);
    downloadCSV(csv, `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const actionColors = {
    READ: 'default',
    MAP: 'secondary',
    REVOKE: 'destructive',
    LOGIN: 'success',
    REGISTER: 'success',
    DELETE: 'warning',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Audit Log</h2>
          <p className="text-sm text-white/40">Complete history of data access events</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-[10px] text-white/30 uppercase tracking-wider">Merchant Token</label>
              <Input
                placeholder="merch_xyz"
                value={merchantFilter}
                onChange={(e) => setMerchantFilter(e.target.value)}
                className="w-48 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/30 uppercase tracking-wider">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/30 uppercase tracking-wider">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40 h-9 text-sm"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleFilter} className="h-9">
              <Filter className="w-3.5 h-3.5 mr-1" /> Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Explanation Dialog */}
      {explanation && (
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">Access Explanation</p>
                  <p className="text-sm text-white/60">{explanation.explanation}</p>
                </div>
              </div>
              <button onClick={() => setExplanation(null)} className="text-white/30 hover:text-white text-sm">✕</button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Fields</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-400" />
              </TableCell>
            </TableRow>
          ) : auditLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-white/30">
                No audit events found
              </TableCell>
            </TableRow>
          ) : (
            auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-white/50">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs">{log.merchant_token || '—'}</TableCell>
                <TableCell>
                  <Badge variant={actionColors[log.action] || 'default'}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {(log.fields || []).map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExplain(log.id)}
                    disabled={explainLoading === log.id}
                    className="text-xs"
                  >
                    {explainLoading === log.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <><MessageSquare className="w-3 h-3 mr-1" /> Explain</>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {auditPagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Showing {((auditPagination.page - 1) * auditPagination.limit) + 1}–
            {Math.min(auditPagination.page * auditPagination.limit, auditPagination.total)} of {auditPagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={auditPagination.page <= 1}
              onClick={() => fetchAuditLogs({ page: auditPagination.page - 1 })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={auditPagination.page * auditPagination.limit >= auditPagination.total}
              onClick={() => fetchAuditLogs({ page: auditPagination.page + 1 })}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
