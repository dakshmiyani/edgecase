import api from './api.js';

export const sendOTP = (identifier) => api.post('/auth/otp/send', { identifier });
export const verifyOTP = (user_token_id, otp) => api.post('/auth/otp/verify', { user_token_id, otp });
export const refreshAuth = () => api.post('/auth/refresh');
export const logout = () => api.post('/auth/logout');
