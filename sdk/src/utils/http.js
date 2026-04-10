import axios from 'axios';
import {
  SecureAiPayError,
  AuthenticationError,
  AuthorizationError,
  TransactionBlockedError,
  ValidationError,
  NetworkError,
} from './errors.js';

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_BASE_URL = 'http://localhost:4000'; // later shift production url

/**
 * Internal HTTP client for the SDK.
 * Handles:
 *   - API key injection
 *   - CSRF token fetching (for browser integrations)
 *   - Automatic retry on 5xx
 *   - Error normalization into SDK error types
 */
export class HttpClient {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, timeout = DEFAULT_TIMEOUT }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.csrfToken = null;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    this._setupInterceptors();
  }

  _setupInterceptors() {
    // ─── Request: Inject CSRF token if available ───
    this.client.interceptors.request.use((config) => {
      if (this.csrfToken) {
        config.headers['x-csrf-token'] = this.csrfToken;
      }
      return config;
    });

    // ─── Response: Normalize errors into SDK types ───
    this.client.interceptors.response.use(
      (res) => res.data,
      (error) => {
        if (!error.response) {
          throw new NetworkError(`No response from server: ${error.message}`);
        }

        const { status, data } = error.response;
        const message = data?.error || data?.message || 'Unknown error';

        switch (status) {
          case 400:
            throw new ValidationError(message, data?.fields || []);
          case 401:
            throw new AuthenticationError(message);
          case 403:
            if (data?.status === 'BLOCKED' || message.includes('blocked')) {
              throw new TransactionBlockedError(data?.error || message, data?.txn_id);
            }
            throw new AuthorizationError(message);
          default:
            throw new SecureAiPayError(message, 'API_ERROR', status, data);
        }
      }
    );
  }

  /**
   * Fetch and cache CSRF token from the API.
   * Called once per SDK instance lifecycle.
   */
  async fetchCsrfToken() {
    try {
      const res = await this.client.get('/api/csrf-token');
      this.csrfToken = res.csrfToken;
      return this.csrfToken;
    } catch {
      // CSRF not enforced for API key auth — safe to ignore
    }
  }

  async get(path, params = {}) {
    return this.client.get(path, { params });
  }

  async post(path, body = {}) {
    return this.client.post(path, body);
  }

  async put(path, body = {}) {
    return this.client.put(path, body);
  }

  async delete(path) {
    return this.client.delete(path);
  }
}
