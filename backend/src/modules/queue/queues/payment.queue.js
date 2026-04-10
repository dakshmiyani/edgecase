import { Queue } from 'bullmq';
import redis from '../../../redis/redis.client.js';

export const paymentInitQueue = new Queue('payment-init', { connection: redis });

console.log('✅ Node.js connected to Redis-based BullMQ (Producer)');
