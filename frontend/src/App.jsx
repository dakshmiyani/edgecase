import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AuditPage from './pages/AuditPage';
import MerchantPage from './pages/MerchantPage';
import AdminPage from './pages/AdminPage';
import SecurityCenterPage from './pages/SecurityCenterPage';
import FederatedLearningPage from './pages/FederatedLearningPage';
import DocsPage from './pages/DocsPage';

// Guards
import ProtectedRoute from './components/shared/ProtectedRoute';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected: User */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user', 'merchant', 'admin']}>
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['user', 'merchant', 'admin']}>
              <AuditPage />
            </ProtectedRoute>
          }
        />

        {/* Protected: Merchant */}
        <Route
          path="/merchant"
          element={
            <ProtectedRoute allowedRoles={['merchant', 'admin']}>
              <MerchantPage />
            </ProtectedRoute>
          }
        />

        {/* Protected: Admin */}
        <Route
          path="/admin/federated"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FederatedLearningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SecurityCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
