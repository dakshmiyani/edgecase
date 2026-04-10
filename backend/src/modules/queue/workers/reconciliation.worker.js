import { Worker } from 'bullmq';
import redis from '../../../redis/redis.client.js';
import { createAuditLog } from '../../audit/audit.service.js';

export const reconciliationWorker = new Worker('reconciliation', async (job) => {
  const { txn_id } = job.data;
  await createAuditLog({ txn_id, event: 'RECONCILIATION_COMPLETED', status: 'RECONCILED', meta: {} });
  console.log(`✅ Transaction Reconciled: ${txn_id}`);
}, { connection: redis, concurrency: 5 });

reconciliationWorker.on('error', (err) => console.error('❌ BullMQ Reconciliation Worker Error:', err.message));
