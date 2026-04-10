import React from 'react';
import AppLayout from '../components/shared/AppLayout';
import FLDashboard from '../components/admin/FLDashboard';
import { Network, Info } from 'lucide-react';

export default function FederatedLearningPage() {
    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Network className="w-8 h-8 text-violet-400" />
                            Collaborative Intelligence
                        </h1>
                        <p className="text-white/40 mt-1 max-w-xl text-sm">
                            Layer 4 — Federated learning orchestration. Improving the global fraud model through private institution-local training rounds.
                        </p>
                    </div>

                    <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Info className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30 uppercase font-mono">Privacy Protocol</p>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">Zero-Knowledge Aggregation</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Hub */}
                <FLDashboard />
            </div>
        </AppLayout>
    );
}
