import { Queue } from 'bullmq';
import axios from 'axios';
import env from '../../config/env.js';
import redis from '../../redis/redis.client.js';

class AIService {
  constructor() {
    this.queueName = 'txn.ingest';
    this.queue = null;
    this.aiBaseUrl = 'http://localhost:8000'; // FastAPI port
  }

  async connect() {
    try {
      // Connect to BullMQ using the existing Redis connection
      this.queue = new Queue(this.queueName, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      // Prevent crashing the whole process on Redis/Queue errors
      this.queue.on('error', (err) => {
        console.error('❌ BullMQ Queue Error:', err.message);
      });
      
      console.log('✅ Node.js connected to Redis-based BullMQ (Producer)');
    } catch (err) {
      console.error('⚠️ BullMQ connection failed:', err.message);
    }
  }

  async publishTransaction(data) {
    if (!this.queue) return;
    try {
      await this.queue.add('process_txn', {
        user_token_id: data.user_token_id,
        amount: data.amount,
        device: data.device || 'unknown',
        merchant_token_id: data.merchant_token_id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('⚠️ Failed to publish to BullMQ:', err.message);
    }
  }

  async getRealTimeScore(data) {
    console.log(`🧠 AI SCRORING: Requesting score for ${data.user_token_id} (Amt: ${data.amount})`);
    try {
      const response = await axios.post(`${this.aiBaseUrl}/fraud/score`, data);
      console.log(`✅ AI RESPONSE: Score: ${response.data.fraud_score}, Risk: ${response.data.risk}, Action: ${response.data.action}`);
      return response.data;
    } catch (err) {
      console.error('⚠️ AI ENGINE OFFLINE: Using low-risk fallback rules.');
      return { fraud_score: 0, risk: 'LOW', action: 'ALLOW', factors: ['Fallback: Service unavailable'] };
    }
  }
}

export default new AIService();
