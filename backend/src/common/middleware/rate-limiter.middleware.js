import redis from '../../redis/redis.client.js';
import { hashIP } from '../../common/utils/encryption.utils.js';

/**
 * Redis-backed rate limiter middleware factory.
 * @param {object} opts
 * @param {string} opts.keyPrefix - Redis key prefix
 * @param {function} opts.keyExtractor - Function to extract unique key from request
 * @param {number} opts.maxRequests - Maximum requests in window
 * @param {number} opts.windowSeconds - Time window in seconds
 * @param {string} opts.message - Error message on limit exceeded
 */
export function rateLimit({ keyPrefix, keyExtractor, maxRequests, windowSeconds, message }) {
  return async (req, res, next) => {
    try {
      const identifier = keyExtractor(req);
      const key = `${keyPrefix}:${identifier}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Set rate limit headers
      res.set('X-RateLimit-Limit', maxRequests.toString());
      res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - count).toString());

      if (count > maxRequests) {
        return res.status(429).json({
          error: message || 'Too many requests',
          retryAfter: await redis.ttl(key),
        });
      }

      next();
    } catch (err) {
      // If Redis is down, allow the request (fail open for availability)
      console.error('Rate limiter error:', err.message);
      next();
    }
  };
}

// Pre-configured rate limiters
export const otpRateLimit = rateLimit({
  keyPrefix: 'otp_rate',
  keyExtractor: (req) => req.body?.user_token_id || 'unknown',
  maxRequests: 100,
  windowSeconds: 3600,
  message: 'OTP rate limit exceeded. Maximum 100 per hour.',
});

export const loginRateLimit = rateLimit({
  keyPrefix: 'login_rate',
  keyExtractor: (req) => hashIP(req.ip || req.connection?.remoteAddress || 'unknown'),
  maxRequests: 100,
  windowSeconds: 3600,
  message: 'Too many login attempts. Try again later.',
});
