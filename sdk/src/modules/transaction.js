/**
 * SecureAiPay SDK — Transaction Module
 *
 * AI-powered, encrypted transaction processing.
 * Amounts are encrypted at rest — only the authenticated user/merchant can decrypt.
 */
export class TransactionModule {
  constructor(http) {
    this.http = http;
  }

  /**
   * Initiate a new secure payment transaction.
   *
   * What happens internally:
   *   1. Fraud score computed by AI engine
   *   2. Decision engine (ALLOW / OTP / BLOCK) evaluates
   *   3. Amount encrypted with user's AES-256 key before DB storage
   *   4. Razorpay order created asynchronously via BullMQ
   *
   * @param {{
   *   user_token_id: string,
   *   amount: number,
   *   currency?: string,
   * }} params
   * @returns {Promise<{ txn_id: string, status: 'INITIATED', message: string }>}
   *
   * @example
   * const txn = await sdk.transactions.create({
   *   user_token_id: 'usr_abc123',
   *   amount: 1500.00,
   * });
   * console.log(txn.txn_id); // "d041fa67-..."
   *
   * @throws {TransactionBlockedError} if AI engine blocks the transaction
   */
  async create({ user_token_id, amount, currency = 'INR' }) {
    return this.http.post('/api/transaction/create', {
      user_token_id,
      amount,
      currency,
    });
  }

  /**
   * Verify / poll a transaction status.
   * Returns DECRYPTED amount — only callable by the transaction owner.
   *
   * @param {string} txn_id
   * @returns {Promise<{
   *   txn_id: string,
   *   status: 'INITIATED'|'PENDING'|'SUCCESS'|'FAILED'|'BLOCKED',
   *   amount: number,
   *   gateway_order_id: string
   * }>}
   *
   * @example
   * const status = await sdk.transactions.verify('d041fa67-...');
   * // status.amount → 1500.00 (decrypted, only for this user)
   */
  async verify(txn_id) {
    return this.http.post('/api/transaction/verify', { txn_id });
  }

  /**
   * Poll until transaction reaches a terminal state (SUCCESS or FAILED).
   * Useful for payment confirmation flows.
   *
   * @param {string} txn_id
   * @param {{ intervalMs?: number, maxAttempts?: number }} options
   * @returns {Promise<{ txn_id: string, status: string, amount: number }>}
   *
   * @example
   * const result = await sdk.transactions.waitForCompletion(txn_id, {
   *   intervalMs: 2000,
   *   maxAttempts: 15,
   * });
   */
  async waitForCompletion(txn_id, { intervalMs = 2000, maxAttempts = 15 } = {}) {
    const terminals = ['SUCCESS', 'FAILED', 'BLOCKED'];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const txn = await this.verify(txn_id);
      if (terminals.includes(txn.status)) return txn;
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Transaction ${txn_id} did not complete after ${maxAttempts} attempts`);
  }
}
