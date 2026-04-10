/**
 * SecureAiPay SDK — Auth Module
 *
 * Handles user authentication via OTP (passwordless).
 * Tokens are managed server-side via HttpOnly cookies.
 */
export class AuthModule {
  constructor(http) {
    this.http = http;
  }

  /**
   * Register a new user.
   * Returns user_token_id — store this to reference the user.
   *
   * @param {{ email: string, phone: string, role?: 'user'|'merchant'|'admin' }} params
   * @returns {Promise<{ user_token_id: string, message: string }>}
   *
   * @example
   * const { user_token_id } = await sdk.auth.register({
   *   email: 'sarthak@example.com',
   *   phone: '9800100001',
   * });
   */
  async register({ email, phone, role = 'user' }) {
    return this.http.post('/api/users/create', { email, phone, role });
  }

  /**
   * Send OTP to user's registered email or phone.
   *
   * @param {string} identifier - email or phone number
   * @returns {Promise<{ user_token_id: string, remaining_attempts: number }>}
   *
   * @example
   * await sdk.auth.sendOTP('sarthak@example.com');
   */
  async sendOTP(identifier) {
    return this.http.post('/api/auth/otp/send', { identifier });
  }

  /**
   * Verify the OTP and establish an authenticated session.
   * Auth cookies are set automatically by the server.
   *
   * @param {{ user_token_id: string, otp: string }} params
   * @returns {Promise<{ message: string, user_token_id: string, role: string }>}
   *
   * @example
   * const session = await sdk.auth.verifyOTP({
   *   user_token_id: 'usr_abc123',
   *   otp: '482910',
   * });
   */
  async verifyOTP({ user_token_id, otp }) {
    return this.http.post('/api/auth/otp/verify', { user_token_id, otp });
  }

  /**
   * Refresh the access token using the refresh token cookie.
   *
   * @returns {Promise<{ message: string, user_token_id: string, role: string }>}
   */
  async refresh() {
    return this.http.post('/api/auth/refresh');
  }

  /**
   * Logout the current session.
   * Clears auth cookies and evicts encryption key from server cache.
   *
   * @returns {Promise<{ message: string }>}
   */
  async logout() {
    return this.http.post('/api/auth/logout');
  }
}
