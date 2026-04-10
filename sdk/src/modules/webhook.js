import crypto from 'crypto';
import { WebhookVerificationError } from '../utils/errors.js';

/**
 * SecureAiPay SDK — Webhook Module
 *
 * Verify and handle incoming Razorpay/SecureAiPay webhook events.
 * Always verify the signature before processing — never trust raw webhook data.
 */
export class WebhookModule {
  constructor({ webhookSecret }) {
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verify a webhook signature from SecureAiPay / Razorpay.
   *
   * @param {string|Buffer} rawBody - Raw request body (must be raw, not parsed)
   * @param {string} signature - Value of `x-razorpay-signature` header
   * @returns {boolean}
   *
   * @example
   * // Express example: use express.raw() middleware for webhook routes
   * app.post('/webhooks/secureaipay', express.raw({ type: 'application/json' }), (req, res) => {
   *   const isValid = sdk.webhooks.verify(req.body, req.headers['x-razorpay-signature']);
   *   if (!isValid) return res.status(400).json({ error: 'Invalid signature' });
   *   const event = sdk.webhooks.parse(req.body);
   *   // handle event...
   *   res.json({ received: true });
   * });
   */
  verify(rawBody, signature) {
    if (!this.webhookSecret) {
      throw new WebhookVerificationError('webhookSecret not configured in SDK');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signature || '', 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  /**
   * Parse and validate a raw webhook body.
   *
   * @param {string|Buffer} rawBody
   * @param {string} signature
   * @returns {{ event: string, payload: object }}
   *
   * @throws {WebhookVerificationError} if signature check fails
   *
   * @example
   * const { event, payload } = sdk.webhooks.parse(req.body, req.headers['x-razorpay-signature']);
   *
   * switch (event) {
   *   case 'payment.captured':
   *     await fulfillOrder(payload.payment.entity.order_id);
   *     break;
   *   case 'payment.failed':
   *     await notifyUser(payload.payment.entity.order_id);
   *     break;
   * }
   */
  parse(rawBody, signature) {
    const isValid = this.verify(rawBody, signature);
    if (!isValid) {
      throw new WebhookVerificationError(
        'Signature mismatch — webhook may be forged or replayed'
      );
    }

    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    return JSON.parse(bodyStr);
  }

  /**
   * Helper: get event type from a parsed webhook.
   *
   * @param {object} webhookData
   * @returns {string}
   *
   * @example
   * const eventType = sdk.webhooks.getEventType(webhookData);
   * // → 'payment.captured'
   */
  getEventType(webhookData) {
    return webhookData?.event || 'unknown';
  }
}
