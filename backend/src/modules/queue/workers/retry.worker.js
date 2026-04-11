import { Worker } from 'bullmq';
import redis from '../../../redis/redis.client.js';
import { pg } from '../../../config/db.js';
import { createAuditLog } from '../../audit/audit.service.js';
import { reconciliationQueue } from '../queues/reconciliation.queue.js';
import { scoreFraudRisk } from '../../fraud/fraud.service.js';

export const webhookWorker = new Worker('webhook-processing', async (job) => {
  const { payload } = job.data;
  const event = payload.event;

  if (event === 'payment.captured' || event === 'payment.failed') {
    const paymentEntity = payload.payload.payment.entity;
    const orderId = paymentEntity.order_id;

    const txn = await pg('transactions').where({ gateway_order_id: orderId }).first();
    if (!txn) {
      console.warn(`Webhook received for unknown order: ${orderId}`);
      return;
    }

    let status = event === 'payment.captured' ? 'SUCCESS' : 'FAILED';
    let flagged = false;

    // ─── AI Fraud Scoring Gate (only for captured payments) ───
    if (event === 'payment.captured') {
      try {
        // Build the transaction features payload for the AI scorer
        const transactionFeatures = {
          amount:              (paymentEntity.amount || 0) / 100,  // Razorpay sends paise
          merchant_risk_score: paymentEntity.notes?.merchant_risk_score ?? 50,
          account_age_days:    paymentEntity.notes?.account_age_days    ?? 180,
          kyc_level:           paymentEntity.notes?.kyc_level           ?? 2,
          avg_txn_amount_7d:   paymentEntity.notes?.avg_txn_amount_7d  ?? 500,
          avg_txn_amount_30d:  paymentEntity.notes?.avg_txn_amount_30d ?? 400,
          is_new_device:       paymentEntity.notes?.is_new_device      ?? 0,
          ip_risk_score:       paymentEntity.notes?.ip_risk_score      ?? 30,
          hour:                new Date().getHours(),
          day_of_week:         new Date().getDay(),
          txn_velocity_1h:     paymentEntity.notes?.txn_velocity_1h    ?? 1,
          txn_velocity_24h:    paymentEntity.notes?.txn_velocity_24h   ?? 5,
          failed_txn_count_24h: paymentEntity.notes?.failed_txn_count_24h ?? 0,
          account_balance:     paymentEntity.notes?.account_balance    ?? 10000,
          post_txn_balance:    paymentEntity.notes?.post_txn_balance   ?? 9500,
          balance_change_ratio: paymentEntity.notes?.balance_change_ratio ?? 0.05,
          amount_to_balance_ratio: paymentEntity.notes?.amount_to_balance_ratio ?? 0.05,
          is_night_txn:        new Date().getHours() >= 23 || new Date().getHours() < 5 ? 1 : 0,
          high_velocity_flag:  paymentEntity.notes?.high_velocity_flag ?? 0,
          unusual_location_flag: paymentEntity.notes?.unusual_location_flag ?? 0,
          transaction_type:    paymentEntity.method || 'UPI',
          merchant_category:   paymentEntity.notes?.merchant_category  ?? 'retail',
          device_type:         paymentEntity.notes?.device_type        ?? 'mobile',
          geo_location:        paymentEntity.notes?.geo_location       ?? 'Mumbai',
        };

        const result = await scoreFraudRisk(transactionFeatures, txn.txn_id);
        flagged = result.flagged;

        console.log(`🛡️  AI Score for ${txn.txn_id}: ${result.fraud_score.toFixed(4)} → ${result.action} (${result.latency_ms}ms)`);

      } catch (err) {
        if (err.code === 'FRAUD_REJECTED') {
          // ─── Hard block: mark as BLOCKED, do NOT proceed to SUCCESS ───
          status = 'BLOCKED';
          console.warn(`🚨 FRAUD BLOCKED txn ${txn.txn_id}: score ${err.fraud_score}`);

          await pg('transactions').where({ txn_id: txn.txn_id }).update({
            status: 'BLOCKED',
            updated_at: pg.fn.now(),
          });

          await createAuditLog({
            txn_id: txn.txn_id,
            event: 'FRAUD_BLOCKED',
            status: 'BLOCKED',
            meta: { payment_id: paymentEntity.id, fraud_score: err.fraud_score },
          });

          // Do NOT push to reconciliation — payment is dead
          return;
        }
        // Any other error: fail-open, let the payment proceed
        console.error(`⚠️  Fraud scoring error for ${txn.txn_id}, proceeding with fail-open:`, err.message);
      }
    }

    // ─── Update transaction status ───
    const updatePayload = { status, updated_at: pg.fn.now() };
    if (flagged) {
      updatePayload.flagged = true;
    }

    await pg('transactions').where({ txn_id: txn.txn_id }).update(updatePayload);

    await createAuditLog({
      txn_id: txn.txn_id,
      event: event === 'payment.captured'
        ? (flagged ? 'PAYMENT_SUCCESS_FLAGGED' : 'PAYMENT_SUCCESS')
        : 'PAYMENT_FAILED',
      status,
      meta: { payment_id: paymentEntity.id, flagged },
    });

    await reconciliationQueue.add('reconcile-txn', { txn_id: txn.txn_id });
  }
}, { connection: redis, concurrency: 5 });

webhookWorker.on('error', (err) => console.error('❌ BullMQ Webhook Worker Error:', err.message));
