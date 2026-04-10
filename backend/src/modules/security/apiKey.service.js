import crypto from 'crypto';
import { pg } from '../../config/db.js';
import { nanoid } from 'nanoid';

/**
 * Generate a new API Key
 * Returns the raw key (to show once) and its metadata
 */
export async function generateApiKey(userTokenId, orgId, name = 'Default Key', type = 'live') {
  const rawKey = `sap_${type}_${nanoid(32)}`;
  const keyPrefix = rawKey.substring(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const [apiKey] = await pg('api_keys').insert({
    user_token_id: userTokenId,
    organization_id: orgId,
    name,
    type,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    scopes: JSON.stringify(['transactions:read', 'merchant:read'])
  }).returning('*');

  return { ...apiKey, rawKey };
}

/**
 * Verify an API Key
 * Returns the user_token_id, org_token_id, and scopes if valid
 */
export async function verifyApiKey(rawKey) {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const apiKey = await pg('api_keys as ak')
    .join('organizations as o', 'ak.organization_id', 'o.id')
    .where({ 'ak.key_hash': keyHash, 'ak.is_active': true })
    .select('ak.*', 'o.org_token_id')
    .first();

  if (!apiKey) return null;

  // Check expiry
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return null;
  }

  // Update last used
  await pg('api_keys').where({ id: apiKey.id }).update({ last_used_at: pg.fn.now() });

  return {
    user_token_id: apiKey.user_token_id,
    org_token_id: apiKey.org_token_id,
    org_id: apiKey.organization_id,
    scopes: apiKey.scopes
  };
}

/**
 * List keys for a user/org
 */
export async function listApiKeys(orgId) {
  return pg('api_keys')
    .where({ organization_id: orgId })
    .select('id', 'name', 'type', 'key_prefix', 'is_active', 'last_used_at', 'created_at')
    .orderBy('created_at', 'desc');
}

/**
 * Revoke a key
 */
export async function revokeApiKey(id, orgId) {
  return pg('api_keys')
    .where({ id, organization_id: orgId })
    .update({ is_active: false });
}
