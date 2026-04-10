import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,          // { user_token_id, role }
  isAuthenticated: false,
  isLoading: true, // Start in loading state for initial checkAuth
  otpSent: false,
  deviceRecognized: true,
  error: null,

  // ─── Actions ───

  // Register new user
  register: async (email, phone, role = 'user') => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/users/create', { email, phone, role });
      set({
        user: { user_token_id: data.user_token_id, role },
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Registration failed', 
        isLoading: false 
      });
      throw err;
    }
  },

  // Send OTP
  sendOTP: async (identifier) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/otp/send', { identifier });
      set({
        otpSent: true,
        deviceRecognized: data.device_recognized,
        user: { user_token_id: data.user_token_id },
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Failed to send OTP', 
        isLoading: false 
      });
      throw err;
    }
  },

  // Verify OTP
  verifyOTP: async (userTokenId, otp) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/otp/verify', {
        user_token_id: userTokenId,
        otp,
      });
      set({
        user: { 
          user_token_id: data.user_token_id, 
          role: data.role,
          org_token_id: data.org_token_id 
        },
        isAuthenticated: true,
        otpSent: false,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ 
        error: err.response?.data?.error || 'Invalid OTP', 
        isLoading: false 
      });
      throw err;
    }
  },

  // Check auth status (on page load)
  checkAuth: async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      // If refresh succeeds, we're authenticated
      set({ 
        isAuthenticated: true,
        user: { 
          user_token_id: data.user_token_id, 
          role: data.role,
          org_token_id: data.org_token_id
        },
        isLoading: false
      });
    } catch {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue with local cleanup even if API fails
    }
    set({
      user: null,
      isAuthenticated: false,
      otpSent: false,
      error: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset OTP state
  resetOTP: () => set({ otpSent: false, deviceRecognized: true }),
}));
