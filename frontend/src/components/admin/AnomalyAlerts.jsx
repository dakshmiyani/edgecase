import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

export default function AnomalyAlerts() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const { data } = await api.get('/admin/anomalies');
        setAnomalies(data.anomalies || []);
      } catch (err) {
        console.error('Failed to fetch anomalies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const severityVariant = {
    HIGH: 'destructive',
    MEDIUM: 'warning',
    LOW: 'success',
  };

  const anomalyCount = anomalies.filter((a) => a.is_anomaly).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Anomaly Detection
          </CardTitle>
          {anomalyCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {anomalyCount} active alert{anomalyCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          </div>
        ) : anomalies.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm text-white/40">No anomalies detected</p>
            <p className="text-xs text-white/20 mt-1">System is operating normally</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant Token</TableHead>
                <TableHead>Access Count</TableHead>
                <TableHead>Unique Users</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Last Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((anomaly, i) => (
                <TableRow key={i} className={anomaly.is_anomaly ? 'bg-red-500/[0.03]' : ''}>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      {anomaly.is_anomaly && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                      {anomaly.merchant_token}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {anomaly.access_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-white/60">
                    {anomaly.unique_user_count}
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[anomaly.severity]}>
                      {anomaly.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-white/40">
                    {new Date(anomaly.last_access).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
