import jwt from 'jsonwebtoken';
import redis from '../../redis/redis.client.js';
import env from '../../config/env.js';

const REFRESH_TTL = 7 * 24 * 3600; // 7 days in seconds

/**
 * Sign an access JWT (short-lived, 15 min).
 * @param {{ user_token_id: string, role: string, org_token_id: string, org_id: number }} payload
 * @returns {string}
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

/**
 * Sign a refresh JWT (long-lived, 7 days) and store in Redis.
 * @param {{ user_token_id: string, role: string, org_token_id: string, org_id: number }} payload
 * @returns {string}
 */
export async function signRefreshToken(payload) {
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });

  // Store in Redis for invalidation support
  const sessionKey = `session:${payload.user_token_id}`;
  await redis.setex(sessionKey, REFRESH_TTL, token);

  return token;
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Verify a refresh token and check it hasn't been invalidated.
 * @param {string} token
 * @returns {object|null} decoded payload or null
 */
export async function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const sessionKey = `session:${decoded.user_token_id}`;
    const stored = await redis.get(sessionKey);

    if (!stored || stored !== token) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Invalidate a refresh token (logout).
 * @param {string} userTokenId
 */
export async function invalidateSession(userTokenId) {
  await redis.del(`session:${userTokenId}`);
}
