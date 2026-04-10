import React from 'react';
import AppLayout from '../components/shared/AppLayout';
import MerchantDashboard from '../components/merchant/MerchantDashboard';

export default function MerchantPage() {
  return (
    <AppLayout>
      <MerchantDashboard />
    </AppLayout>
  );
}
