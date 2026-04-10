import React from 'react';
import { AlertTriangle, Smartphone } from 'lucide-react';

export default function DeviceBanner() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6 animate-pulse">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
        <Smartphone className="w-5 h-5 text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-amber-300">New device detected</p>
        <p className="text-xs text-amber-300/60 mt-0.5">Additional verification required for your security</p>
      </div>
    </div>
  );
}
