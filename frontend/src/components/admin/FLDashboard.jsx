import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { 
    Cpu, 
    Network, 
    ShieldAlert, 
    RefreshCcw, 
    ArrowUpRight, 
    History,
    Activity,
    Lock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function FLDashboard() {
    const [stats, setStats] = useState({
        global_model: { version: 0, accuracy: 0, auc_roc: 0, created_at: null },
        current_round: { status: 'IDLE', updates_received: 0, updates_expected: 0, deadline_remaining_seconds: 0 },
        nodes: { total_registered: 0, active: 0, suspect: 0, list: [] },
        rounds_history: []
    });
    const [lastSync, setLastSync] = useState(new Date());
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);

    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setIsSyncing(true);
        try {
            const { data } = await axios.get('/fl/stats');
            setStats(data);
            setLastSync(new Date());
            setError(null);
        } catch (err) {
            console.error('Failed to fetch FL stats:', err);
            setError('Connection interrupted');
        } finally {
            setLoading(false);
            setTimeout(() => setIsSyncing(false), 1000);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Mock trend for Recharts
    const trendData = stats.rounds_history.map((r) => ({
        round: r.round,
        auc: r.auc_roc
    })).reverse();

    return (
        <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    title="Global Model v{version}" 
                    value={(stats.global_model.auc_roc * 100).toFixed(1) + '%'} 
                    subvalue="AUC-ROC Score"
                    icon={Cpu}
                    color="violet"
                    version={stats.global_model.version}
                />
                <MetricCard 
                    title="Active Nodes" 
                    value={stats.nodes.active} 
                    subvalue={`/ ${stats.nodes.total_registered} registered`}
                    icon={Network}
                    color="cyan"
                />
                <MetricCard 
                    title="Training Round" 
                    value={stats.current_round.status} 
                    subvalue={stats.current_round.status === 'IN_PROGRESS' 
                        ? `${stats.current_round.updates_received}/${stats.current_round.updates_expected} updates` 
                        : 'Engine Idle'}
                    icon={Activity}
                    color={stats.current_round.status === 'IN_PROGRESS' ? 'green' : 'white'}
                />
                <MetricCard 
                    title="Privacy Guard" 
                    value="ACTIVE" 
                    subvalue="DP + Krum Enabled"
                    icon={Lock}
                    color="emerald"
                />
            </div>

            {/* Sync Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'} ${isSyncing ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {error ? 'Status: DISCONNECTED' : 'Status: LIVE SYNC'}
                        </span>
                    </div>
                    {error && <span className="text-[10px] text-red-400 font-medium">{error}</span>}
                </div>
                <div className="text-[10px] text-white/20 font-mono">
                    Last update: {lastSync.toLocaleTimeString()}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Accuracy Trend Chart */}
                <Card className="lg:col-span-8">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <History className="w-4 h-4 text-violet-400" />
                            Model Performance History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="round" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={[0.8, 1]} stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f0a21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#a78bfa' }}
                                />
                                <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status and Controls */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Round Control</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {stats.current_round.status === 'IN_PROGRESS' ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-white/40">Round Progress</span>
                                    <span className="text-white">{(stats.current_round.updates_received / stats.current_round.updates_expected * 100).toFixed(0)}%</span>
                                </div>
                                <Progress value={stats.current_round.updates_received / stats.current_round.updates_expected * 100} className="h-1.5" />
                                <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono italic">
                                    <RefreshCcw className="w-3 h-3 animate-spin" />
                                    {stats.current_round.deadline_remaining_seconds}s until timeout
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                <p className="text-xs text-white/30 mb-4">No active training round</p>
                                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600">
                                    Start Round 7
                                </Button>
                            </div>
                        )}
                        
                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Active nodes</h4>
                            <div className="space-y-2">
                                {stats.nodes.list.length > 0 ? (
                                    stats.nodes.list.map((node) => (
                                        <NodeRow key={node.id} id={node.id} weight={node.weight} status={node.status} />
                                    ))
                                ) : (
                                    <p className="text-[10px] text-white/20 italic py-2">No nodes connected</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subvalue, icon: Icon, color, version }) {
    const colors = {
        violet: 'bg-violet-500/10 text-violet-400',
        cyan: 'bg-cyan-500/10 text-cyan-400',
        green: 'bg-green-500/10 text-green-400',
        emerald: 'bg-emerald-500/10 text-emerald-400',
        white: 'bg-white/5 text-white/40'
    };
    
    return (
        <Card className="border border-white/[0.06] bg-white/[0.02]">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                            {title.replace('{version}', version || '')}
                        </p>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                        <p className="text-[11px] text-white/40 mt-1">{subvalue}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${colors[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function NodeRow({ id, weight, status }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'SUSPECT' ? 'bg-amber-500' : 'bg-green-500'}`} />
                <span className="text-[10px] font-mono text-white/60">{id}</span>
            </div>
            <span className="text-[10px] text-white/30">w={(weight * 100).toFixed(0)}%</span>
        </div>
    );
}
