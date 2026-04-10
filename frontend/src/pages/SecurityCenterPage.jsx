import React from 'react';
import AppLayout from '../components/shared/AppLayout';
import RuleManager from '../components/admin/RuleManager';
import RealTimeWarRoom from '../components/admin/RealTimeWarRoom';
import { ShieldCheck, Zap, History, BarChart3 } from 'lucide-react';

export default function SecurityCenterPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header section with Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-violet-400" />
              Security Center
            </h1>
            <p className="text-white/40 mt-1 max-w-xl">
              Real-time policy configuration and threat monitoring for the SecureAiPay deterministic layer.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase font-mono">Engine Latency</p>
                <p className="text-xl font-bold text-white font-mono">12ms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Rules on Left, Live Feed on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <RuleManager />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <RealTimeWarRoom />
            
            {/* Quick Stats / Summary Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600/10 to-indigo-600/5 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">System Integrity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Active Rules</span>
                  <span className="text-white font-mono">5</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Cache Status</span>
                  <Badge variant="success" className="text-[10px] py-0">WARM</Badge>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-[10px] text-white/20 leading-relaxed italic">
                    All decisions are persisted to the Neon PostgreSQL audit layer with 60s Redis deduplication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Badge({ children, variant = 'default', className = '' }) {
  const versions = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    default: 'bg-white/10 text-white/60 border-white/10'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium leading-none ${versions[variant]} ${className}`}>
      {children}
    </span>
  );
}
