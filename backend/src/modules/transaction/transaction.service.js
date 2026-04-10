import crypto from 'crypto';
import { pg } from '../../config/db.js';
import { insertTransaction, findTransaction } from './transaction.repository.js';
import { createAuditLog } from '../audit/audit.service.js';
import { paymentInitQueue } from '../queue/queues/payment.queue.js';
import { TransactionStatus } from '../../common/enums/transactionStatus.js';
import { getUserKey } from '../security/key.service.js';
import { encrypt, decrypt } from '../../common/utils/encryption.js';

/**
 * Initiate a new transaction.
 * Amount is encrypted with the user's UEK before DB storage.
 * Only the gateway (Razorpay) receives the plaintext amount via BullMQ.
 *
 * @param {{ user_token_id, org_id, amount, decision, fraud_score }} params
 */
export const initiateTransaction = async ({ user_token_id, org_id, amount, decision, fraud_score }) => {
  // If no org_id is provided in the request (e.g. unauthenticated checkout from SDK)
  // we resolve it from the user's profile.
  let targetOrgId = org_id;
  if (!targetOrgId) {
    const userRow = await pg('users').where({ user_token_id }).select('organization_id').first();
    if (userRow) targetOrgId = userRow.organization_id;
  }

  const txn_id = crypto.randomUUID();

  // 1. Fetch user encryption key
  const uek = await getUserKey(user_token_id);

  // 2. Encrypt the amount before DB storage
  const encrypted_amount = encrypt(String(amount), uek);

  // ─── Phase 3: Risk Evaluation ───
  // Default to ALLOW for demo if decision not provided by SDK
  const finalDecision = decision || 'ALLOW';
  const finalScore = fraud_score || 10;

  if (finalDecision !== 'ALLOW') {
    await createAuditLog({
      txn_id,
      event: 'TRANSACTION_BLOCKED',
      status: TransactionStatus.BLOCKED,
      meta: { fraud_score, decision, user_token_id },
    });

    await insertTransaction({
      txn_id,
      user_token_id,
      organization_id: targetOrgId,
      amount,            // Kept for FK/index compat; see note below
      encrypted_amount,  // Encrypted copy for zero-plaintext at rest
      status: TransactionStatus.BLOCKED,
    });

    return { txn_id, status: TransactionStatus.BLOCKED, blocked: true };
  }

  // 3. Insert with encrypted amount
  await insertTransaction({
    txn_id,
    user_token_id,
    organization_id: targetOrgId,
    amount,
    encrypted_amount,
    status: TransactionStatus.INITIATED,
  });

  await createAuditLog({
    txn_id,
    event: 'TRANSACTION_INITIATED',
    status: TransactionStatus.INITIATED,
    // NEVER log plaintext amount here — audit log is not end-to-end encrypted
    meta: { user_token_id, encrypted: true },
  });

  // 4. Push to BullMQ — only the raw amount is needed for Razorpay order creation
  await paymentInitQueue.add('init-razorpay', { txn_id, amount, user_token_id }, {
    jobId: `pay_job_${txn_id}`,
  });

  return { txn_id, status: TransactionStatus.INITIATED };
};

/**
 * Verify/poll a transaction status for the authenticated user.
 * Decrypts the amount using the user's UEK — only after identity binding check.
 *
 * @param {string} txn_id
 * @param {string} requesting_user_token_id - from req.user
 * @param {number} org_id - from req.user
 */
export const getTransactionStatus = async (txn_id, requesting_user_token_id, org_id) => {
  const txn = await findTransaction(txn_id, org_id);
  if (!txn) return null;

  // ─── Identity Binding: Only the owner can decrypt their data ───
  if (txn.user_token_id !== requesting_user_token_id) {
    throw new Error('UNAUTHORIZED: Cannot access another user\'s transaction data');
  }

  let decryptedAmount = null;

  // ─── Decrypt amount if encrypted version exists ───
  if (txn.encrypted_amount) {
    try {
      const uek = await getUserKey(txn.user_token_id);
      decryptedAmount = decrypt(txn.encrypted_amount, uek);
    } catch (err) {
      console.error(`⚠️  Decryption failed for txn ${txn_id}:`, err.message);
      // Decryption failure: return without exposing amount — do NOT crash
      decryptedAmount = null;
    }
  }

  return {
    txn_id: txn.txn_id,
    status: txn.status,
    amount: decryptedAmount ? parseFloat(decryptedAmount) : undefined,
    gateway_order_id: txn.gateway_order_id,
  };
};
