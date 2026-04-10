import crypto from 'crypto';
import redis from '../../redis/redis.client.js';

/**
 * Device fingerprint middleware.
 * Reads X-Device-Fingerprint header and checks against known devices.
 * Attaches `req.deviceInfo` with recognition status.
 */
export async function deviceFingerprint(req, res, next) {
  const fingerprint = req.headers['x-device-fingerprint'];

  if (!fingerprint) {
    req.deviceInfo = { recognized: false, fingerprint: null };
    return next();
  }

  // Hash the fingerprint for storage
  const fpHash = crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 32);
  req.deviceInfo = { recognized: false, fingerprint: fpHash };

  // If user is authenticated, check known devices
  const userTokenId = req.body?.user_token_id || req.user?.user_token_id;
  if (userTokenId) {
    const deviceKey = `device:${userTokenId}`;
    const isKnown = await redis.sismember(deviceKey, fpHash);
    req.deviceInfo.recognized = !!isKnown;
  }

  next();
}

/**
 * Register a device fingerprint as known for a user.
 * @param {string} userTokenId
 * @param {string} fpHash
 */
export async function registerDevice(userTokenId, fpHash) {
  if (!fpHash) return;
  const deviceKey = `device:${userTokenId}`;
  await redis.sadd(deviceKey, fpHash);
}
