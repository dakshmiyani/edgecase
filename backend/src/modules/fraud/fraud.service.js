import axios from 'axios';
import { FraudEvent } from './fraud.model.js';

const AI_SCORE_URL = 'http://localhost:8001/score';

// Thresholds
const REJECT_THRESHOLD = 0.85;
const FLAG_THRESHOLD   = 0.60;

/**
 * scoreFraudRisk — calls the FedGuard inference middleware to evaluate
 * a transaction's fraud probability before it clears.
 *
 * @param {object} transactionData - Features to send to the AI scorer.
 *   Must include amount and any available transaction metadata.
 * @param {string} txn_id - The internal transaction ID for logging.
 *
 * @returns {{ fraud_score, action, flagged, latency_ms }}
 *   action: 'approved' | 'flagged' | 'rejected'
 *   Throws if fraud_score > REJECT_THRESHOLD to block the payment.
 */
export async function scoreFraudRisk(transactionData, txn_id) {
  let fraud_score = 0;
  let ai_action   = 'fail-open';
  let latency_ms  = 0;
  let action      = 'approved';
  let flagged     = false;

  try {
    const response = await axios.post(AI_SCORE_URL, transactionData, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });

    const data = response.data;

    // If the model isn't loaded, AI returns fail-open — let the payment proceed
    if (data.error) {
      console.warn(`⚠️  AI scoring fail-open for txn ${txn_id}: ${data.error}`);
      await logFraudEvent(txn_id, 0, 'approved', 'fail-open', 0, transactionData);
      return { fraud_score: 0, action: 'approved', flagged: false, latency_ms: 0 };
    }

    fraud_score = data.fraud_score;
    ai_action   = data.action;
    latency_ms  = data.latency_ms || 0;

  } catch (err) {
    // Network error / timeout — fail-open: never block a legit payment
    // because the AI service is down
    console.error(`⚠️  AI scoring unreachable for txn ${txn_id}: ${err.message}`);
    await logFraudEvent(txn_id, 0, 'approved', 'unreachable', 0, transactionData);
    return { fraud_score: 0, action: 'approved', flagged: false, latency_ms: 0 };
  }

  // ─── Decision Logic ───
  if (fraud_score > REJECT_THRESHOLD) {
    action = 'rejected';
  } else if (fraud_score > FLAG_THRESHOLD) {
    action  = 'flagged';
    flagged = true;
  } else {
    action = 'approved';
  }

  // ─── Persist to fraud_events collection ───
  await logFraudEvent(txn_id, fraud_score, action, ai_action, latency_ms, transactionData);

  // ─── If rejected, throw to block the payment ───
  if (action === 'rejected') {
    const error = new Error(
      `FRAUD_REJECTED: Transaction ${txn_id} blocked — fraud_score ${fraud_score.toFixed(4)} exceeds threshold ${REJECT_THRESHOLD}`
    );
    error.code = 'FRAUD_REJECTED';
    error.fraud_score = fraud_score;
    throw error;
  }

  return { fraud_score, action, flagged, latency_ms };
}

/**
 * Logs every scoring event to the fraud_events MongoDB collection.
 */
async function logFraudEvent(transaction_id, fraud_score, action, ai_action, latency_ms, features_sent) {
  try {
    await FraudEvent.create({
      transaction_id,
      fraud_score,
      action,
      ai_action,
      latency_ms,
      features_sent,
    });
  } catch (err) {
    // Never let a logging failure break the payment flow
    console.error(`⚠️  Failed to log fraud event for ${transaction_id}:`, err.message);
  }
}
