import { Queue } from 'bullmq';
import redis from '../../../redis/redis.client.js';

export const reconciliationQueue = new Queue('reconciliation', { connection: redis });
