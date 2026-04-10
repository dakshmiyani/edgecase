import mongoose from 'mongoose';

const accessEventSchema = new mongoose.Schema({
  user_token_id: { type: String, required: true, index: true },
  merchant_token_id: { type: String, index: true },
  action: { type: String, enum: ['READ', 'MAP', 'REVOKE', 'LOGIN', 'REGISTER', 'DELETE', 'TRANSACTION', 'FRAUD_BLOCK'], required: true },
  fields: [{ type: String }],
  ip_hash: { type: String },
  device_fingerprint: { type: String },
  explanation: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Compound index for user + time range queries
accessEventSchema.index({ user_token_id: 1, timestamp: -1 });
accessEventSchema.index({ merchant_token_id: 1, timestamp: -1 });

export const AccessEvent = mongoose.model('AccessEvent', accessEventSchema, 'access_events');
