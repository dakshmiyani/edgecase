import { Worker } from 'bullmq';
import redis from '../../../redis/redis.client.js';
import { pg } from '../../../config/db.js';
import { createRazorpayOrder } from '../../../integrations/razorpay/razorpay.service.js';
import { createAuditLog } from '../../audit/audit.service.js';

export const paymentWorker = new Worker('payment-init', async (job) => {
  const { txn_id, amount } = job.data;

  try {
    const order = await createRazorpayOrder(amount, txn_id.substring(0, 40));

    await pg('transactions').where({ txn_id }).update({
      status: 'PENDING',
      gateway_order_id: order.id,
      updated_at: pg.fn.now(),
    });

    await createAuditLog({ txn_id, event: 'GATEWAY_ORDER_CREATED', status: 'PENDING', meta: { gateway_order_id: order.id } });

    return { status: 'payment_initialized', txn_id, order_id: order.id };
  } catch (err) {
    await pg('transactions').where({ txn_id }).update({ status: 'FAILED', updated_at: pg.fn.now() });
    await createAuditLog({ txn_id, event: 'GATEWAY_ORDER_FAILED', status: 'FAILED', meta: { error: err.message } });
    console.error(`❌ Payment Worker Error [${txn_id}]:`, err.message);
    throw err;
  }
}, { connection: redis, concurrency: 10, attempts: 5, backoff: { type: 'exponential', delay: 2000 } });

paymentWorker.on('error', (err) => console.error('❌ BullMQ Payment Worker Error:', err.message));
