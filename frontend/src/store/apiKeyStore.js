import { create } from 'zustand';
import api from '../lib/api';

export const useApiKeyStore = create((set, get) => ({
  keys: [],
  isLoading: false,
  error: null,
  newKey: null, // Temporary store for the newly created raw key (to show once)

  fetchKeys: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/keys');
      set({ keys: data, isLoading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Failed to fetch API keys', 
        isLoading: false 
      });
    }
  },

  createKey: async (name, type = 'live') => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/keys', { name, type });
      // The server returns { ...metadata, rawKey: '...' }
      set((state) => ({ 
        keys: [data, ...state.keys],
        newKey: data, // Save the full object including rawKey
        isLoading: false 
      }));
      return data;
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Failed to create API key', 
        isLoading: false 
      });
      throw err;
    }
  },

  revokeKey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/keys/${id}`);
      set((state) => ({
        keys: state.keys.filter(k => k.id !== id),
        isLoading: false
      }));
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Failed to revoke API key', 
        isLoading: false 
      });
      throw err;
    }
  },

  clearNewKey: () => set({ newKey: null })
}));
