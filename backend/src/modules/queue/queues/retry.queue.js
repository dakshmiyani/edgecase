import { Queue } from 'bullmq';
import redis from '../../../redis/redis.client.js';

export const webhookProcessingQueue = new Queue('webhook-processing', { connection: redis });
