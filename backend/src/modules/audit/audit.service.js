import { AuditLog } from './audit.model.js';

export const createAuditLog = async ({ txn_id, event, status, meta = {} }) => {
  return AuditLog.create({ txn_id, event, status, meta });
};

export const getAuditLogsForTxn = async (txn_id) => {
  return AuditLog.find({ txn_id }).sort({ timestamp: -1 }).lean();
};
