import { HttpClient } from './utils/http.js';
import { AuthModule } from './modules/auth.js';
import { TransactionModule } from './modules/transaction.js';
import { MerchantModule } from './modules/merchant.js';
import { WebhookModule } from './modules/webhook.js';
import { UserModule } from './modules/user.js';
import {
  SecureAiPayError,
  AuthenticationError,
  AuthorizationError,
  TransactionBlockedError,
  ValidationError,
  NetworkError,
  WebhookVerificationError,
} from './utils/errors.js';

/**
 * SecureAiPay SDK
 *
 * Official JavaScript SDK for AI-powered, encrypted payment processing.
 *
 * @example
 * import SecureAiPay from '@secureaipay/sdk';
 *
 * const sdk = new SecureAiPay({
 *   apiKey: 'sap_live_xxxxxxxxxxxxxxxx',
 *   baseUrl: 'https://api.secureaipay.com',
 *   webhookSecret: 'whsec_xxxxxxxxxxxxxxxx',
 * });
 *
 * // Register user
 * const { user_token_id } = await sdk.auth.register({
 *   email: 'sarthak@brand.com',
 *   phone: '9800100001',
 * });
 *
 * // Create a payment
 * const txn = await sdk.transactions.create({
 *   user_token_id,
 *   amount: 2499.00,
 * });
 */
class SecureAiPay {
  /**
   * @param {{
   *   apiKey: string,
   *   baseUrl?: string,
   *   webhookSecret?: string,
   *   timeout?: number,
   * }} config
   */
  constructor({ apiKey, baseUrl, webhookSecret, timeout } = {}) {
    if (!apiKey) {
      throw new SecureAiPayError(
        'SecureAiPay SDK requires an apiKey. Get yours at https://dashboard.secureaipay.com',
        'MISSING_API_KEY'
      );
    }

    this._config = { apiKey, baseUrl, webhookSecret, timeout };

    // ─── Internal HTTP client ───
    this._http = new HttpClient({ apiKey, baseUrl, timeout });

    // ─── Public Modules ───
    this.auth = new AuthModule(this._http);
    this.transactions = new TransactionModule(this._http);
    this.merchant = new MerchantModule(this._http);
    this.users = new UserModule(this._http);
    this.webhooks = new WebhookModule({ webhookSecret });
  }

  /**
   * Initialize the SDK — fetches CSRF token for browser-based integrations.
   * Call this once before making API requests in a browser environment.
   *
   * @returns {Promise<SecureAiPay>}
   *
   * @example
   * const sdk = await SecureAiPay.create({ apiKey: 'sap_live_...' });
   */
  static async create(config) {
    const sdk = new SecureAiPay(config);
    await sdk._http.fetchCsrfToken();
    return sdk;
  }

  /**
   * SDK version
   */
  get version() {
    return '1.0.0';
  }
}

// ─── Named exports for error types ───
export {
  SecureAiPay,
  SecureAiPayError,
  AuthenticationError,
  AuthorizationError,
  TransactionBlockedError,
  ValidationError,
  NetworkError,
  WebhookVerificationError,
};

// ─── Default export for convenience ───
export default SecureAiPay;
