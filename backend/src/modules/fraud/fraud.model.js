import mongoose from 'mongoose';

const FraudEventSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true, index: true },
  fraud_score:    { type: Number, required: true },
  action:         { type: String, required: true, enum: ['approved', 'flagged', 'rejected'] },
  ai_action:      { type: String },           // raw action from AI: "pass", "flag", "block"
  latency_ms:     { type: Number },
  features_sent:  { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp:      { type: Date, default: Date.now },
});

export const FraudEvent = mongoose.model('FraudEvent', FraudEventSchema);
