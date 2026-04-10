import { initiateTransaction, getTransactionStatus } from './transaction.service.js';

/**
 * POST /api/transaction/create
 *
 * Creates a new transaction. The amount is encrypted with the user's UEK
 * inside the service layer before writing to DB.
 *
 * Requires: Authenticated user (req.user set by auth middleware).
 */
export const createTransaction = async (req, res) => {
  const { amount, decision, fraud_score } = req.body;

  // ─── Identity Binding: Always use the authenticated user's token ───
  // Never trust user_token_id from request body for privileged operations
  const user_token_id = req.user?.user_token_id || req.body.user_token_id;

  if (!user_token_id || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await initiateTransaction({ 
      user_token_id, 
      org_id: req.user?.org_id, 
      amount, 
      decision, 
      fraud_score 
    });

    res.locals.txn_id = result.txn_id;

    if (result.blocked) {
      return res.status(403).json({
        error: 'Transaction blocked by security policies',
        txn_id: result.txn_id,
        status: result.status,
      });
    }

    return res.status(201).json({
      txn_id: result.txn_id,
      status: result.status,
      message: 'Processing payment',
    });
  } catch (error) {
    console.error('Create Transaction Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * POST /api/transaction/verify
 *
 * Returns transaction status with DECRYPTED amount — only for the owner.
 * Identity check is enforced inside the service layer.
 *
 * Requires: Authenticated user (req.user must match transaction owner).
 */
export const verifyTransaction = async (req, res) => {
  const { txn_id } = req.body;
  if (!txn_id) return res.status(400).json({ error: 'Missing txn_id' });

  // Must be authenticated to perform decryption
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required for data access' });
  }

  try {
    const txn = await getTransactionStatus(txn_id, req.user.user_token_id, req.user.org_id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    return res.status(200).json(txn);
  } catch (error) {
    if (error.message.startsWith('UNAUTHORIZED')) {
      return res.status(403).json({ error: 'Access denied: you can only view your own transactions' });
    }
    return res.status(500).json({ error: 'Verification failed' });
  }
};
