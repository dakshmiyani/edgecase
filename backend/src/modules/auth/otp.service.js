import crypto from 'crypto';
import redis from '../../redis/redis.client.js';

const OTP_TTL = 300;       // 5 minutes
const RATE_TTL = 3600;     // 1 hour
const MAX_OTP_PER_HOUR = 100;

/**
 * Generate a 6-digit OTP, cache in Redis, and enforce rate limiting.
 * @param {string} userTokenId
 * @returns {{ otp: string, remaining: number }}
 */
export async function generateOTP(userTokenId) {
  // Rate limit check
  const rateKey = `otp_rate:${userTokenId}`;
  const count = await redis.get(rateKey);

  if (count && parseInt(count) >= MAX_OTP_PER_HOUR) {
    throw new Error('OTP rate limit exceeded. Max 3 per hour.');
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store OTP with TTL
  const otpKey = `otp:${userTokenId}`;
  await redis.setex(otpKey, OTP_TTL, otp);

  // Increment rate counter
  const newCount = await redis.incr(rateKey);
  if (newCount === 1) {
    await redis.expire(rateKey, RATE_TTL);
  }

  return {
    otp,
    remaining: MAX_OTP_PER_HOUR - newCount,
  };
}

/**
 * Verify an OTP against the cached value.
 * @param {string} userTokenId
 * @param {string} inputOtp
 * @returns {boolean}
 */
export async function verifyOTP(userTokenId, inputOtp) {
  const otpKey = `otp:${userTokenId}`;
  const storedOtp = await redis.get(otpKey);

  if (!storedOtp) return false;
  if (storedOtp !== inputOtp) return false;

  // Delete OTP after successful verification (one-time use)
  await redis.del(otpKey);
  return true;
}
