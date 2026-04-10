import decisionService from './decision.service.js';
import { logAccess } from '../audit-log/access-audit.service.js';
import { Queue } from 'bullmq';
import redis from '../../redis/redis.client.js';

// Setup Side-effect queues
const decisionLogQueue = new Queue('decision-log', { connection: redis });
const otpTriggerQueue = new Queue('otp-trigger', { connection: redis });
const fraudAlertQueue = new Queue('fraud-alert', { connection: redis });

/**
 * POST /decision/evaluate
 * Evaluate a fraud decision for a transaction.
 */
export async function evaluateDecision(req, res) {
  try {
    const { 
      user_token_id, 
      fraud_score, 
      amount, 
      device = 'unknown', 
      location_changed = false,
      merchant_token_id,
      ai_available = true
    } = req.body;

    // 1. Validation boilerplate (usually handled by middleware but explicit here)
    if (!user_token_id || fraud_score === undefined || !amount || !merchant_token_id) {
      return res.status(400).json({ error: 'Missing required decision vectors' });
    }

    // 2. Run Engine
    const result = await decisionService.evaluate({
      user_token_id,
      fraud_score,
      amount,
      device,
      location_changed,
      merchant_token_id,
      ai_available
    });

    // 3. Side Effects (Async via BullMQ)
    // Always log the decision
    await decisionLogQueue.add('log-decision', {
      ...result,
      user_token_id,
      merchant_token_id,
      timestamp: new Date().toISOString()
    });

    // If OTP, trigger it
    if (result.decision === 'OTP') {
      await otpTriggerQueue.add('trigger-otp', {
        user_token_id,
        txn_id: result.txn_id,
        reason: result.reason
      });
    }

    // If BLOCK, trigger fraud notification
    if (result.decision === 'BLOCK') {
      await fraudAlertQueue.add('trigger-alert', {
        user_token_id,
        txn_id: result.txn_id,
        fraud_score,
        reason: result.reason
      });
      
      // Real-time alert feed (Redis List)
      await redis.lpush('alerts:realtime', JSON.stringify({
        user_token_id,
        fraud_score,
        reason: result.reason,
        timestamp: new Date().toISOString(),
        txn_id: result.txn_id
      }));
      await redis.ltrim('alerts:realtime', 0, 499);
    }

    res.json(result);

  } catch (err) {
    console.error('❌ Controller Decision Error:', err.message);
    res.status(500).json({ error: 'Decision processing failed' });
  }
}
