import React from 'react';
import { Shield } from 'lucide-react';

export default function TrustBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <Shield className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-xs font-medium text-emerald-300">Your data is encrypted</span>
    </div>
  );
}
