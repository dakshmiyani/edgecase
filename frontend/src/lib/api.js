import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send HttpOnly cookies
  timeout: 10000,
});

// ─── Request Interceptor: Attach CSRF token and device fingerprint ───
api.interceptors.request.use(async (config) => {
  // Attach device fingerprint
  const fingerprint = generateFingerprint();
  config.headers['X-Device-Fingerprint'] = fingerprint;

  // Attach CSRF token for mutating requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    try {
      const { data } = await axios.get('/api/csrf-token', {
        withCredentials: true,
      });
      config.headers['X-CSRF-Token'] = data.csrfToken;
    } catch {
      // Continue without CSRF if endpoint fails
    }
  }

  return config;
});

// ─── Response Interceptor: Handle token expiry ───
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired, try to refresh
    if (error.response?.status === 401 &&
        error.response?.data?.code === 'TOKEN_EXPIRED' &&
        !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch {
        // Refresh failed — redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

function generateFingerprint() {
  const components = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ];
  return btoa(components.join('|')).slice(0, 32);
}

export default api;
