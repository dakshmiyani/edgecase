import React from 'react';
import AppLayout from '../components/shared/AppLayout';
import PrivacyDashboard from '../components/dashboard/PrivacyDashboard';
import PaymentTerminal from '../components/dashboard/PaymentTerminal';

export default function UserDashboardPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <PrivacyDashboard />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <PaymentTerminal />
            {/* Can add extra widgets here in the future */}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
