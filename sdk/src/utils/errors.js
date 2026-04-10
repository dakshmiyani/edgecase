/**
 * SecureAiPay SDK — Custom Error Classes
 *
 * All SDK errors carry a `code` field for programmatic handling.
 */

export class SecureAiPayError extends Error {
  constructor(message, code = 'SDK_ERROR', statusCode = null, details = null) {
    super(message);
    this.name = 'SecureAiPayError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthenticationError extends SecureAiPayError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SecureAiPayError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class TransactionBlockedError extends SecureAiPayError {
  constructor(reason = 'Blocked by fraud policy', txnId = null) {
    super(`Transaction blocked: ${reason}`, 'TRANSACTION_BLOCKED', 403);
    this.name = 'TransactionBlockedError';
    this.txnId = txnId;
    this.reason = reason;
  }
}

export class ValidationError extends SecureAiPayError {
  constructor(message, fields = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NetworkError extends SecureAiPayError {
  constructor(message = 'Network request failed') {
    super(message, 'NETWORK_ERROR', null);
    this.name = 'NetworkError';
  }
}

export class WebhookVerificationError extends SecureAiPayError {
  constructor(message = 'Webhook signature verification failed') {
    super(message, 'WEBHOOK_VERIFICATION_ERROR', 400);
    this.name = 'WebhookVerificationError';
  }
}
