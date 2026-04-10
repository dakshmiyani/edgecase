import React from 'react';
import AppLayout from '../components/shared/AppLayout';
import AdminDashboard from '../components/admin/AdminDashboard';

export default function AdminPage() {
  return (
    <AppLayout>
      <AdminDashboard />
    </AppLayout>
  );
}
