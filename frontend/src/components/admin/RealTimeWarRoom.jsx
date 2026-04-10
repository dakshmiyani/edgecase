import React, { useEffect, useState } from 'react';
import { usePolicyStore } from '../../store/policyStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, ShieldAlert, Clock, ExternalLink } from 'lucide-react';

export default function RealTimeWarRoom() {
  const { realtimeAlerts, fetchAlerts } = usePolicyStore();
  
  useEffect(() => {
    // Poll for new alerts every 3 seconds
    const interval = setInterval(fetchAlerts, 3000);
    fetchAlerts();
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return (
    <Card className="border-red-500/20 bg-red-500/[0.02]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-400">
          <Activity className="w-4 h-4 animate-pulse" />
          Real-Time Threat Monitor
        </CardTitle>
        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {realtimeAlerts.length === 0 ? (
            <div className="py-8 text-center text-white/20 italic text-sm">
              Listening for security threats...
            </div>
          ) : (
            realtimeAlerts.map((alert, i) => (
              <div 
                key={alert.txn_id || i}
                className="flex items-start gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] group hover:border-red-500/30 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-white/40 truncate">
                      {alert.user_token_id}
                    </span>
                    <span className="text-[10px] text-white/20 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-white/90 mb-1">
                    Blocked: {alert.reason}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] py-0 border-red-500/20 text-red-400">
                      Score: {alert.fraud_score}
                    </Badge>
                    <button className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Audit Trace <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
