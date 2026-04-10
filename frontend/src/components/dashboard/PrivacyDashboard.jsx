import React, { useEffect } from 'react';
import { usePrivacyStore } from '../../store/privacyStore';
import PrivacyScoreCard from './PrivacyScoreCard';
import AccessLog from './AccessLog';
import DataExposure from './DataExposure';
import TrustBadge from '../shared/TrustBadge';
import { Loader2 } from 'lucide-react';

export default function PrivacyDashboard() {
  const { privacyScore, dataExposure, accessLog, exposedFields, fetchDashboard, isLoading } = usePrivacyStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading && privacyScore === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Privacy Dashboard</h2>
        <p className="text-sm text-white/40">Monitor and control your data exposure in real-time</p>
      </div>

      {/* Score + Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PrivacyScoreCard score={privacyScore || 0} exposure={dataExposure || 'LOW'} />
        </div>
        <div className="lg:col-span-2">
          <AccessLog logs={accessLog} />
        </div>
      </div>

      {/* Data Exposure */}
      <DataExposure fields={exposedFields} />
    </div>
  );
}
