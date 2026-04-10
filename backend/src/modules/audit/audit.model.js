import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  txn_id: { type: String, required: true, index: true },
  event: { type: String, required: true },
  status: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
