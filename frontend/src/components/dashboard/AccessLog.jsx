import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, Eye } from 'lucide-react';

export default function AccessLog({ logs = [] }) {
  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="w-4 h-4 text-violet-400" />
          Recent Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-4">No recent access events</p>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-mono text-violet-400">
                    {log.merchant_token?.slice(0, 5) || 'sys'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white/80 font-mono">{log.merchant_token || 'System'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-white/20" />
                    <span className="text-[11px] text-white/30">{formatTime(log.accessed_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {(log.fields || []).map((field, j) => (
                  <Badge key={j} variant="secondary" className="text-[10px]">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
