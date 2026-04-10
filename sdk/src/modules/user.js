/**
 * SecureAiPay SDK — User Module
 *
 * User profile management.
 */
export class UserModule {
  constructor(http) {
    this.http = http;
  }

  /**
   * Get a user's non-sensitive profile.
   *
   * @param {string} user_token_id
   * @returns {Promise<{ user_token_id: string, role: string, created_at: string }>}
   *
   * @example
   * const profile = await sdk.users.get('usr_abc123');
   */
  async get(user_token_id) {
    return this.http.get(`/api/users/${user_token_id}`);
  }

  /**
   * Soft delete a user account.
   * Only the account owner or an admin can call this.
   *
   * @param {string} user_token_id
   * @returns {Promise<{ message: string }>}
   */
  async delete(user_token_id) {
    return this.http.delete(`/api/users/${user_token_id}`);
  }
}
