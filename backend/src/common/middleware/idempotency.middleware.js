import crypto from 'crypto';
import redis from '../../redis/redis.client.js';
import { pg } from '../../config/db.js';

/**
 * Idempotency Middleware — ensures exactly-once execution for critical POST endpoints.
 */
export const enforceIdempotency = async (req, res, next) => {
  if (req.method !== 'POST') return next();

  const payloadStr = JSON.stringify({ body: req.body, user: req.user?.id });
  const requestHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
  const redisKey = `idempotency:${requestHash}`;

  try {
    const cachedResponse = await redis.get(redisKey);
    if (cachedResponse) {
      console.log(`⚡ Idempotency cache hit: ${redisKey}`);
      return res.status(200).json(JSON.parse(cachedResponse));
    }

    const existingEntry = await pg('idempotency').where({ request_hash: requestHash }).first();
    if (existingEntry?.response) {
      console.log(`🗄️ Idempotency DB hit: ${requestHash}`);
      await redis.setex(redisKey, 86400, JSON.stringify(existingEntry.response));
      return res.status(200).json(existingEntry.response);
    }

    req.idempotencyHash = requestHash;
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const txn_id = res.locals.txn_id;
        if (txn_id) {
          redis.setex(redisKey, 86400, JSON.stringify(body)).catch(console.error);
          pg('idempotency').insert({
            txn_id,
            request_hash: requestHash,
            response: JSON.stringify(body),
          }).catch((err) => {
            if (err.code !== '23505') console.error('Idempotency DB Save Error:', err.message);
          });
        }
      }
      originalJson(body);
    };

    next();
  } catch (error) {
    console.error('Idempotency Error', error);
    next(error);
  }
};
