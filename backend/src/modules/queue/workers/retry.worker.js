import { Worker } from 'bullmq';
import redis from '../../../redis/redis.client.js';
import { pg } from '../../../config/db.js';
import { createAuditLog } from '../../audit/audit.service.js';
import { reconciliationQueue } from '../queues/reconciliation.queue.js';

export const webhookWorker = new Worker('webhook-processing', async (job) => {
  const { payload } = job.data;
  const event = payload.event;

  if (event === 'payment.captured' || event === 'payment.failed') {
    const paymentEntity = payload.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const status = event === 'payment.captured' ? 'SUCCESS' : 'FAILED';

    const txn = await pg('transactions').where({ gateway_order_id: orderId }).first();
    if (!txn) {
      console.warn(`Webhook received for unknown order: ${orderId}`);
      return;
    }

    await pg('transactions').where({ txn_id: txn.txn_id }).update({ status, updated_at: pg.fn.now() });

    await createAuditLog({
      txn_id: txn.txn_id,
      event: event === 'payment.captured' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
      status,
      meta: { payment_id: paymentEntity.id },
    });

    await reconciliationQueue.add('reconcile-txn', { txn_id: txn.txn_id });
  }
}, { connection: redis, concurrency: 5 });

webhookWorker.on('error', (err) => console.error('❌ BullMQ Webhook Worker Error:', err.message));
