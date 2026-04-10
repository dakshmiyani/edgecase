import api from '../services/api.js';

/**
 * Create a new transaction via the idempotency gate.
 * @param {{ user_token_id: string, amount: number, decision: string, fraud_score: number }} data
 * @returns {Promise<{ txn_id: string, status: string }>}
 */
export const createTransaction = (data) => api.post('/transaction/create', data);

/**
 * Poll for transaction status / gateway_order_id after BullMQ processes it.
 * @param {string} txn_id
 * @returns {Promise<{ txn_id: string, status: string, gateway_order_id: string }>}
 */
export const verifyTransaction = (txn_id) => api.post('/transaction/verify', { txn_id });
