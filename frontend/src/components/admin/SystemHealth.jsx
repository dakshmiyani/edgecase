import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Loader2, Activity, ShieldAlert, Users, Key, Clock, AlertTriangle, Zap } from 'lucide-react';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const { data } = await api.get('/admin/health');
        setHealth(data);
      } catch (err) {
        console.error('Failed to fetch health:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const stats = [
    {
      label: 'Active Sessions',
      value: health?.active_sessions || 0,
      icon: Users,
      color: 'violet',
      bgClass: 'bg-violet-500/10 border-violet-500/20',
      iconClass: 'text-violet-400',
    },
    {
      label: 'OTP Sends (24h)',
      value: health?.otp_send_rate_24h || 0,
      icon: Key,
      color: 'cyan',
      bgClass: 'bg-cyan-500/10 border-cyan-500/20',
      iconClass: 'text-cyan-400',
    },
    {
      label: 'Login Attempts (24h)',
      value: health?.login_attempts_24h || 0,
      icon: Activity,
      color: 'amber',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      iconClass: 'text-amber-400',
    },
    {
      label: 'Total Events (24h)',
      value: health?.total_events_24h || 0,
      icon: Zap,
      color: 'emerald',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      iconClass: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bgClass} border flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.iconClass}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-white/40">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Uptime */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/60">Server Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-mono text-emerald-400">{formatUptime(health?.uptime || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
