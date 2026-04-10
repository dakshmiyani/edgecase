/**
 * SecureAiPay SDK — Webhook Handler Example
 *
 * Drop this into any Express.js server to handle payment events.
 * IMPORTANT: Use express.raw() for webhook routes — do NOT parse JSON first.
 */

import express from 'express';
import SecureAiPay, { WebhookVerificationError } from '../src/index.js';

const app = express();

const sdk = new SecureAiPay({
  apiKey: 'sap_live_your_api_key_here',
  baseUrl: 'http://localhost:4000',
  webhookSecret: 'your_razorpay_webhook_secret',
});

// ─── IMPORTANT: Use raw body parser for webhook routes ───
app.post(
  '/webhooks/payment',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-razorpay-signature'];

    try {
      // 1. Verify + parse webhook
      const webhookData = sdk.webhooks.parse(req.body, signature);
      const eventType = sdk.webhooks.getEventType(webhookData);

      console.log(`📥 Webhook received: ${eventType}`);

      // 2. Handle events
      switch (eventType) {
        case 'payment.captured':
          const payment = webhookData.payload.payment.entity;
          console.log(`✅ Payment captured: ₹${payment.amount / 100} for order ${payment.order_id}`);
          // → fulfill order, send receipt email, update your DB
          break;

        case 'payment.failed':
          const failedPayment = webhookData.payload.payment.entity;
          console.log(`❌ Payment failed for order ${failedPayment.order_id}`);
          // → notify user, retry logic
          break;

        default:
          console.log(`ℹ️  Unhandled event: ${eventType}`);
      }

      res.json({ received: true });

    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        console.error('🚫 Webhook signature invalid — possible forgery attempt');
        return res.status(400).json({ error: 'Invalid signature' });
      }
      console.error('❌ Webhook processing error:', err.message);
      res.status(500).json({ error: 'Internal error' });
    }
  }
);

app.listen(3001, () => {
  console.log('🔔 Webhook server running on http://localhost:3001');
  console.log('   POST /webhooks/payment');
});
