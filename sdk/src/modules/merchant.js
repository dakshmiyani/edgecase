/**
 * SecureAiPay SDK — Merchant Module
 *
 * Manage customer mappings, view decrypted transaction data,
 * and access business analytics — all secured by identity binding.
 */
export class MerchantModule {
  constructor(http) {
    this.http = http;
  }

  /**
   * Link a customer (user_token_id) to your merchant account.
   * Only linked customers' data is accessible to you.
   *
   * @param {{
   *   user_token_id: string,
   *   merchant_user_id: string
   * }} params
   * @returns {Promise<{ message: string, merchant_token_id: string, user_token_id: string }>}
   *
   * @example
   * await sdk.merchant.mapCustomer({
   *   user_token_id: 'usr_abc123',
   *   merchant_user_id: 'YOUR_INTERNAL_ID_001',
   * });
   */
  async mapCustomer({ user_token_id, merchant_user_id }) {
    return this.http.post('/api/merchant/map', { user_token_id, merchant_user_id });
  }

  /**
   * Get a paginated list of all your mapped customers.
   *
   * @param {{ page?: number, limit?: number }} params
   * @returns {Promise<{ users: Array, pagination: object, rate_limit: object }>}
   *
   * @example
   * const { users } = await sdk.merchant.listCustomers({ page: 1, limit: 20 });
   */
  async listCustomers({ page = 1, limit = 20 } = {}) {
    return this.http.get('/api/merchant/users', { page, limit });
  }

  /**
   * Get DECRYPTED transaction history for a mapped customer.
   *
   * Security: The server decrypts using the customer's UEK.
   * You never receive the encryption key — only the plaintext values.
   * DB ciphertext is completely unreadable without the master key.
   *
   * @param {string} user_token_id - The customer's token
   * @param {{ page?: number, limit?: number }} options
   * @returns {Promise<{
   *   customer_token: string,
   *   transactions: Array<{
   *     txn_id: string,
   *     amount: number,
   *     status: string,
   *     created_at: string
   *   }>,
   *   pagination: object
   * }>}
   *
   * @example
   * const result = await sdk.merchant.getCustomerTransactions('usr_abc123');
   * result.transactions.forEach(txn => {
   *   console.log(`₹${txn.amount} — ${txn.status}`);
   *   // Output: ₹1250.75 — SUCCESS
   * });
   *
   * @throws {AuthorizationError} if you don't have an active mapping with this customer
   */
  async getCustomerTransactions(user_token_id, { page = 1, limit = 20 } = {}) {
    return this.http.get(`/api/merchant/transactions/${user_token_id}`, { page, limit });
  }
}
