import { create } from 'zustand';
import api from '../lib/api';

export const useMerchantStore = create((set) => ({
  // State
  mappedUsers: [],
  pagination: { page: 1, limit: 20, total: 0 },
  rateLimit: { remaining: 100, limit: 100 },
  transactions: [],
  txPagination: { page: 1, limit: 20, total: 0 },
  orgTransactions: [],
  orgTxPagination: { page: 1, limit: 20, total: 0 },
  isLoading: false,
  error: null,

  // ─── Actions ───

  // Fetch mapped users
  fetchMappedUsers: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/merchant/users', { params: { page } });
      set({
        mappedUsers: data.users,
        pagination: data.pagination,
        rateLimit: data.rate_limit,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to load users', isLoading: false });
    }
  },

  // Map a new token
  mapToken: async (merchantUserId, userTokenId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/merchant/map', {
        merchant_user_id: merchantUserId,
        user_token_id: userTokenId,
      });
      // Refresh list
      const listData = await api.get('/merchant/users');
      set({
        mappedUsers: listData.data.users,
        pagination: listData.data.pagination,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Mapping failed', isLoading: false });
      throw err;
    }
  },

  // Fetch transactions for a user token
  fetchTransactions: async (userToken, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/merchant/transactions/${userToken}`, {
        params: { page },
      });
      set({
        transactions: data.transactions,
        txPagination: data.pagination,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to load transactions', isLoading: false });
    }
  },

  // Fetch all transactions for the organization
  fetchOrgTransactions: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/merchant/transactions/org', {
        params: { page },
      });
      set({
        orgTransactions: data.transactions,
        orgTxPagination: data.pagination,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to load organization transactions', isLoading: false });
    }
  },

  // NEW: Create a mock transaction to test AI scoring
  createTransaction: async (userToken, amount, category) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/merchant/transaction', {
        user_token_id: userToken,
        amount,
        category,
        device: 'web_agent_test',
      });
      // Refresh transactions
      const txData = await api.get(`/merchant/transactions/${userToken}`);
      set({
        transactions: txData.data.transactions,
        txPagination: txData.data.pagination,
        isLoading: false,
      });
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Transaction failed';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },
}));
