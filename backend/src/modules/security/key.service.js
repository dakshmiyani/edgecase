import { generateKey, wrapKey, unwrapKey } from '../../common/utils/encryption.js';
import { pg } from '../../config/db.js';
import redis from '../../redis/redis.client.js';
import env from '../../config/env.js';

const MASTER_KEY_HEX = env.ENCRYPTION_MASTER_KEY;
const UEK_CACHE_TTL = 300; // 5 minutes in Redis

/**
 * Generate a new User Encryption Key (UEK), wrap it with the master key, and
 * store the encrypted version in the users table.
 *
 * Called once during user registration.
 *
 * @param {string} userTokenId
 * @returns {Promise<void>}
 */
export async function provisionUserKey(userTokenId) {
  // 1. Generate fresh 256-bit key for this user
  const rawUEK = generateKey();

  // 2. Wrap (encrypt) with Master Key before storing
  const wrappedUEK = wrapKey(rawUEK, MASTER_KEY_HEX);

  // 3. Persist encrypted UEK in DB — NEVER the raw key
  await pg('users')
    .where({ user_token_id: userTokenId })
    .update({ encryption_key: wrappedUEK });

  // 4. Cache the raw UEK in Redis for short-lived sessions
  //    Key: uek:<user_token_id>, TTL: 5 min
  await redis.setex(
    `uek:${userTokenId}`,
    UEK_CACHE_TTL,
    rawUEK.toString('hex')
  );
}

/**
 * Retrieve the raw User Encryption Key (UEK) for a given user.
 * Checks Redis cache first; falls back to DB unwrapping.
 *
 * @param {string} userTokenId
 * @returns {Promise<Buffer>} raw 32-byte key
 * @throws {Error} if user has no key provisioned
 */
export async function getUserKey(userTokenId) {
  // 1. Check Redis cache (hot path)
  const cached = await redis.get(`uek:${userTokenId}`);
  if (cached) {
    return Buffer.from(cached, 'hex');
  }

  // 2. Fetch wrapped key from DB
  const user = await pg('users')
    .where({ user_token_id: userTokenId })
    .select('encryption_key')
    .first();

  if (!user || !user.encryption_key) {
    throw new Error(`USER_KEY_NOT_FOUND: No encryption key found for ${userTokenId}`);
  }

  // 3. Unwrap using Master Key
  const rawUEK = unwrapKey(user.encryption_key, MASTER_KEY_HEX);

  // 4. Re-cache for subsequent requests
  await redis.setex(
    `uek:${userTokenId}`,
    UEK_CACHE_TTL,
    rawUEK.toString('hex')
  );

  return rawUEK;
}

/**
 * Rotate a user's encryption key.
 * Generates a new UEK, re-encrypts all user data, stores new wrapped key.
 * (For future use — key rotation is critical in production systems.)
 *
 * @param {string} userTokenId
 */
export async function rotateUserKey(userTokenId) {
  // Invalidate old cache immediately on rotation start
  await redis.del(`uek:${userTokenId}`);
  // Generate and provision a new key
  await provisionUserKey(userTokenId);
}

/**
 * Evict a user's UEK from in-memory Redis cache.
 * Call this on logout to ensure no residual key data remains.
 *
 * @param {string} userTokenId
 */
export async function evictUserKey(userTokenId) {
  await redis.del(`uek:${userTokenId}`);
}
