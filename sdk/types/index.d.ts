export interface SecureAiPayConfig {
  /** Your API key from the SecureAiPay dashboard */
  apiKey: string;
  /** API base URL. Defaults to https://api.secureaipay.com */
  baseUrl?: string;
  /** Webhook secret for signature verification */
  webhookSecret?: string;
  /** Request timeout in ms. Default: 15000 */
  timeout?: number;
}

export interface UserProfile {
  user_token_id: string;
  role: 'user' | 'merchant' | 'admin';
  created_at: string;
}

export interface RegisterParams {
  email: string;
  phone: string;
  role?: 'user' | 'merchant' | 'admin';
}

export interface OTPVerifyParams {
  user_token_id: string;
  otp: string;
}

export interface CreateTransactionParams {
  user_token_id: string;
  amount: number;
  currency?: string;
}

export interface Transaction {
  txn_id: string;
  status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'BLOCKED';
  amount?: number;
  gateway_order_id?: string;
  created_at?: string;
}

export interface MapCustomerParams {
  user_token_id: string;
  merchant_user_id: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ─── Error Classes ───
export class SecureAiPayError extends Error {
  code: string;
  statusCode: number | null;
  details: unknown;
}

export class AuthenticationError extends SecureAiPayError {}
export class AuthorizationError extends SecureAiPayError {}
export class TransactionBlockedError extends SecureAiPayError {
  txnId: string | null;
  reason: string;
}
export class ValidationError extends SecureAiPayError {
  fields: string[];
}
export class NetworkError extends SecureAiPayError {}
export class WebhookVerificationError extends SecureAiPayError {}

// ─── Module Types ───
export interface AuthModule {
  register(params: RegisterParams): Promise<{ user_token_id: string; message: string }>;
  sendOTP(identifier: string): Promise<{ user_token_id: string; remaining_attempts: number }>;
  verifyOTP(params: OTPVerifyParams): Promise<{ message: string; user_token_id: string; role: string }>;
  refresh(): Promise<{ message: string; user_token_id: string; role: string }>;
  logout(): Promise<{ message: string }>;
}

export interface TransactionModule {
  create(params: CreateTransactionParams): Promise<Transaction>;
  verify(txn_id: string): Promise<Transaction>;
  waitForCompletion(txn_id: string, options?: { intervalMs?: number; maxAttempts?: number }): Promise<Transaction>;
}

export interface MerchantModule {
  mapCustomer(params: MapCustomerParams): Promise<{ message: string; merchant_token_id: string; user_token_id: string }>;
  listCustomers(options?: PaginationOptions): Promise<{ users: UserProfile[]; pagination: object; rate_limit: object }>;
  getCustomerTransactions(user_token_id: string, options?: PaginationOptions): Promise<{ customer_token: string; transactions: Transaction[]; pagination: object }>;
}

export interface WebhookModule {
  verify(rawBody: string | Buffer, signature: string): boolean;
  parse(rawBody: string | Buffer, signature: string): { event: string; payload: object };
  getEventType(webhookData: object): string;
}

export interface UserModule {
  get(user_token_id: string): Promise<UserProfile>;
  delete(user_token_id: string): Promise<{ message: string }>;
}

// ─── Main SDK ───
export default class SecureAiPay {
  auth: AuthModule;
  transactions: TransactionModule;
  merchant: MerchantModule;
  webhooks: WebhookModule;
  users: UserModule;
  readonly version: string;

  constructor(config: SecureAiPayConfig);

  static create(config: SecureAiPayConfig): Promise<SecureAiPay>;
}
