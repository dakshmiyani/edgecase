import { AccessEvent } from '../audit-log/access-audit.model.js';
import { hashIP } from '../../common/utils/encryption.utils.js';

/**
 * Log a data access event to MongoDB.
 * Never stores raw PII — only tokens, hashes, and timestamps.
 *
 * @param {object} params
 * @param {string} params.user_token_id
 * @param {string} [params.merchant_token_id]
 * @param {'READ'|'MAP'|'REVOKE'|'LOGIN'|'REGISTER'|'DELETE'} params.action
 * @param {string[]} [params.fields]
 * @param {string} [params.ip]
 * @param {string} [params.device_fingerprint]
 * @param {string} [params.explanation]
 */
export async function logAccess({
  user_token_id,
  merchant_token_id = null,
  action,
  fields = [],
  ip = null,
  device_fingerprint = null,
  explanation = null,
}) {
  await AccessEvent.create({
    user_token_id,
    merchant_token_id,
    action,
    fields,
    ip_hash: ip ? hashIP(ip) : null,
    device_fingerprint,
    explanation,
    timestamp: new Date(),
  });
}

/**
 * Get paginated audit logs for a user.
 * @param {string} userTokenId
 * @param {object} opts
 * @returns {Promise<{ logs: object[], total: number }>}
 */
export async function getUserLogs(userTokenId, { page = 1, limit = 20, merchant = null, dateFrom = null, dateTo = null } = {}) {
  const query = { user_token_id: userTokenId };

  if (merchant) query.merchant_token_id = merchant;
  if (dateFrom || dateTo) {
    query.timestamp = {};
    if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
    if (dateTo) query.timestamp.$lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    AccessEvent.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AccessEvent.countDocuments(query),
  ]);

  return { logs, total };
}

/**
 * Get a single log entry with its explanation.
 * @param {string} logId
 * @returns {Promise<object|null>}
 */
export async function getLogExplanation(logId) {
  const log = await AccessEvent.findById(logId).lean();
  if (!log) return null;

  // Generate plain-language explanation
  const actionMap = {
    READ: 'accessed',
    MAP: 'linked to',
    REVOKE: 'had access revoked for',
    LOGIN: 'logged into',
    REGISTER: 'registered',
    DELETE: 'deleted',
  };

  const actionText = actionMap[log.action] || log.action;
  const fieldsText = log.fields?.length ? log.fields.join(', ') : 'no specific fields';
  const merchantText = log.merchant_token_id || 'the system';

  return {
    ...log,
    explanation: log.explanation || `${merchantText} ${actionText} your data (${fieldsText}) on ${new Date(log.timestamp).toLocaleString()}.`,
  };
}
