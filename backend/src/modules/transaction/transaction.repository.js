import { pg } from '../../config/db.js';

export const insertTransaction = (data) => pg('transactions').insert(data);

export const updateTransaction = (txn_id, orgId, data) =>
  pg('transactions')
    .where({ txn_id, organization_id: orgId })
    .update({ ...data, updated_at: pg.fn.now() });

export const findTransaction = (txn_id, orgId) =>
  pg('transactions')
    .where({ txn_id, organization_id: orgId })
    .first();

export const findTransactionByToken = (txn_token_id, orgId) =>
  pg('transactions')
    .where({ user_token_id: txn_token_id, organization_id: orgId })
    .orderBy('transaction_at', 'desc');
