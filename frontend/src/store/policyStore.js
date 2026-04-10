import { create } from 'zustand';
import api from '../lib/api';

export const usePolicyStore = create((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,
  realtimeAlerts: [],

  // Fetch all rules
  fetchRules: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/policy/rules');
      set({ rules: data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch rules', isLoading: false });
    }
  },

  // Create or Update rule
  saveRule: async (ruleData) => {
    set({ isLoading: true });
    try {
      if (ruleData.rule_id) {
        await api.patch(`/policy/rules/${ruleData.rule_id}`, ruleData);
      } else {
        await api.post('/policy/rules', ruleData);
      }
      await get().fetchRules();
      set({ isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to save rule', isLoading: false });
      throw err;
    }
  },

  // Delete rule
  deleteRule: async (ruleId) => {
    try {
      await api.delete(`/policy/rules/${ruleId}`);
      await get().fetchRules();
    } catch (err) {
      set({ error: 'Failed to delete rule' });
    }
  },

  // Mocked: In real app, this would use WebSockets or SSE
  // For now, we'll expose it for polling
  fetchAlerts: async () => {
    try {
      const { data } = await api.get('/admin/alerts/realtime');
      set({ realtimeAlerts: data });
    } catch (err) {
      // Quiet fail for alerts
    }
  }
}));
