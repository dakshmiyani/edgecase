import redis from '../../redis/redis.client.js';
import { pg } from '../../config/db.js';
import { AccessEvent } from '../audit-log/access-audit.model.js';
import { encrypt, decrypt, hashValue } from '../../common/utils/encryption.js';
import env from '../../config/env.js';

/**
 * GET /admin/health
 * System health metrics: active sessions, OTP rate, failed auths.
 */
export async function getSystemHealth(req, res) {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 3600 * 1000);

    // Count active sessions in Redis
    const sessionKeys = await redis.keys('session:*');
    const activeSessions = sessionKeys.length;

    // Count OTP sends in last 24h
    const otpRateKeys = await redis.keys('otp_rate:*');
    let otpSendRate = 0;
    for (const key of otpRateKeys) {
      const count = await redis.get(key);
      otpSendRate += parseInt(count || 0);
    }

    // Failed auth attempts (from MongoDB)
    const failedAttempts = await AccessEvent.countDocuments({
      action: 'LOGIN',
      timestamp: { $gte: twentyFourHoursAgo },
    });

    // Total users
    const totalEvents = await AccessEvent.countDocuments({
      timestamp: { $gte: twentyFourHoursAgo },
    });

    res.json({
      active_sessions: activeSessions,
      otp_send_rate_24h: otpSendRate,
      login_attempts_24h: failedAttempts,
      total_events_24h: totalEvents,
      uptime: process.uptime(),
      timestamp: now,
    });
  } catch (err) {
    console.error('System health error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve system health' });
  }
}

/**
 * GET /admin/anomalies
 * Flag if a merchant accesses > 100 tokens in 1 hour.
 */
export async function getAnomalies(req, res) {
  try {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);

    // Aggregate merchant access counts in the last hour
    const anomalies = await AccessEvent.aggregate([
      {
        $match: {
          merchant_token_id: { $ne: null },
          timestamp: { $gte: oneHourAgo },
        },
      },
      {
        $group: {
          _id: '$merchant_token_id',
          access_count: { $sum: 1 },
          unique_users: { $addToSet: '$user_token_id' },
          last_access: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          merchant_token: '$_id',
          access_count: 1,
          unique_user_count: { $size: '$unique_users' },
          last_access: 1,
          is_anomaly: { $gt: ['$access_count', 100] },
        },
      },
      { $sort: { access_count: -1 } },
      { $limit: 50 },
    ]);

    res.json({
      anomalies: anomalies.map((a) => ({
        merchant_token: a.merchant_token,
        access_count: a.access_count,
        unique_user_count: a.unique_user_count,
        last_access: a.last_access,
        is_anomaly: a.is_anomaly,
        severity: a.access_count > 100 ? 'HIGH' : a.access_count > 50 ? 'MEDIUM' : 'LOW',
      })),
      checked_at: new Date(),
    });
  } catch (err) {
    console.error('Anomalies error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve anomalies' });
  }
}

/**
 * GET /admin/logs
 * System-wide paginated audit logs (no raw PII).
 */
export async function getAdminLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const [logs, total] = await Promise.all([
      AccessEvent.find()
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AccessEvent.countDocuments(),
    ]);

    res.json({
      logs: logs.map((l) => ({
        id: l._id,
        user_token: l.user_token_id,
        merchant_token: l.merchant_token_id,
        action: l.action,
        fields: l.fields,
        timestamp: l.timestamp,
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('Admin logs error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
}

/**
 * GET /admin/alerts/realtime
 * Fetch the last 500 blocked transaction alerts from Redis.
 */
export async function getRealtimeAlerts(req, res) {
  try {
    const alerts = await redis.lrange('alerts:realtime', 0, 499);
    res.json(alerts.map(a => JSON.parse(a)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}

/**
 * GET /admin/stats
 * Aggregate stats: total, allow/otp/block counts, fallback activations.
 */
export async function getDecisionStats(req, res) {
  try {
    // Note: In a real app, this would query the PG 'decisions' table.
    // For now we'll mock it or run a raw query if pg is available.
    // We'll import pg inside to avoid top-level dependency if needed, 
    // but db.js exports it.
    
    // For now, let's just return a placeholder so the UI has structure
    res.json({
      total_decisions_24h: 0,
      allow_count: 0,
      otp_count: 0,
      block_count: 0,
      fallback_activations: 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

/**
 * GET /admin/users
 * List all team members for the organization
 */
export async function getSystemUsers(req, res) {
  try {
    const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');

    const users = await pg('users')
      .where({ 
        organization_id: req.user.org_id,
        is_deleted: false 
      })
      .select(
        'user_token_id', 'role', 'created_at',
        'name_cipher', 'name_iv', 'name_tag',
        'email_cipher', 'email_iv', 'email_tag',
        'phone_cipher', 'phone_iv', 'phone_tag'
      )
      .orderBy('created_at', 'desc');
    
    const decryptedUsers = users.map(u => {
      let name = null;
      let email = null;
      let phone = null;

      try {
        if (u.name_cipher) {
          name = decrypt(Buffer.from(JSON.stringify({
            data: u.name_cipher,
            iv: u.name_iv,
            tag: u.name_tag
          })).toString('base64'), masterKey);
        }
        if (u.email_cipher) {
          email = decrypt(Buffer.from(JSON.stringify({
            data: u.email_cipher,
            iv: u.email_iv,
            tag: u.email_tag
          })).toString('base64'), masterKey);
        }
        if (u.phone_cipher) {
          phone = decrypt(Buffer.from(JSON.stringify({
            data: u.phone_cipher,
            iv: u.phone_iv,
            tag: u.phone_tag
          })).toString('base64'), masterKey);
        }
      } catch (err) {
        console.warn(`Decryption failed for user ${u.user_token_id}:`, err.message);
      }

      return {
        user_token_id: u.user_token_id,
        name: name || 'Encrypted',
        email: email || 'Encrypted',
        phone: phone || 'Encrypted',
        role: u.role,
        created_at: u.created_at
      };
    });

    res.json(decryptedUsers);
  } catch (err) {
    console.error('List users error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

/**
 * POST /admin/users
 * Add a new team member to the organization
 */
export async function addTeamMember(req, res) {
  const { name, email, phone, role } = req.body;
  const org_id = req.user.org_id;

  if (!email || !phone || !role) {
    return res.status(400).json({ error: 'Email, phone and role are required' });
  }

  // Define allowed roles for this brand management
  const allowedRoles = ['merchant', 'developer', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
    const user_token_id = `usr_${(Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)).slice(0, 12)}`;
    
    // Encrypt PII
    const nameEnc = name ? JSON.parse(Buffer.from(encrypt(name, masterKey), 'base64').toString('utf8')) : null;
    const emailEnc = JSON.parse(Buffer.from(encrypt(email, masterKey), 'base64').toString('utf8'));
    const phoneEnc = JSON.parse(Buffer.from(encrypt(phone, masterKey), 'base64').toString('utf8'));

    const [newUser] = await pg('users').insert({
      user_token_id,
      organization_id: org_id,
      name_cipher: nameEnc?.data,
      name_iv: nameEnc?.iv,
      name_tag: nameEnc?.tag,
      name_hash: name ? hashValue(name) : null,
      email_cipher: emailEnc.data,
      email_iv: emailEnc.iv,
      email_tag: emailEnc.tag,
      email_hash: hashValue(email),
      phone_cipher: phoneEnc.data,
      phone_iv: phoneEnc.iv,
      phone_tag: phoneEnc.tag,
      phone_hash: hashValue(phone),
      role,
      is_active: true
    }).returning(['user_token_id', 'role', 'created_at']);

    res.status(201).json({
      ...newUser,
      name,
      email,
      phone
    });
  } catch (err) {
    console.error('Add team member error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'User with this email, phone or token already exists' });
    }
    res.status(500).json({ error: 'Failed to add team member' });
  }
}
