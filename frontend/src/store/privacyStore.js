import { create } from 'zustand';
import api from '../lib/api';

export const usePrivacyStore = create((set) => ({
  // State
  privacyScore: null,
  dataExposure: null,
  accessLog: [],
  exposedFields: [],
  auditLogs: [],
  auditPagination: { page: 1, limit: 20, total: 0 },
  isLoading: false,
  error: null,

  // ─── Actions ───

  // Fetch privacy dashboard data
  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/user/privacy');
      set({
        privacyScore: data.privacy_score,
        dataExposure: data.data_exposure,
        accessLog: data.access_log,
        exposedFields: data.exposed_fields,
        isLoading: false,
      });
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Failed to load dashboard', 
        isLoading: false 
      });
    }
  },

  // Revoke field access
  revokeField: async (field) => {
    try {
      await api.patch('/user/privacy/revoke', { field });
      // Re-fetch dashboard to get updated data
      const { data } = await api.get('/user/privacy');
      set({
        privacyScore: data.privacy_score,
        dataExposure: data.data_exposure,
        exposedFields: data.exposed_fields,
      });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Revocation failed' });
    }
  },

  // Fetch audit logs (paginated, filterable)
  fetchAuditLogs: async ({ page = 1, limit = 20, merchant = null, dateFrom = null, dateTo = null } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = { page, limit };
      if (merchant) params.merchant = merchant;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const { data } = await api.get('/audit/logs', { params });
      set({
        auditLogs: data.logs,
        auditPagination: data.pagination,
        isLoading: false,
      });
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Failed to load audit logs', 
        isLoading: false 
      });
    }
  },

  // Get log explanation
  explainLog: async (logId) => {
    try {
      const { data } = await api.get(`/audit/${logId}/explain`);
      return data;
    } catch (err) {
      return null;
    }
  },
}));
