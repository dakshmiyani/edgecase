import { nanoid } from 'nanoid';
import { pg } from '../../config/db.js';
import redis from '../../redis/redis.client.js';
import env from '../../config/env.js';
import { encrypt, decrypt, hashValue, wrapKey, generateKey } from '../../common/utils/encryption.js';
import { logAccess } from '../audit-log/access-audit.service.js';
import { provisionUserKey } from '../security/key.service.js';

/**
 * GET /users/bootstrap-status
 * Returns { bootstrapped: boolean }
 */
export async function getBootstrapStatus(req, res) {
  try {
    const count = await pg('users').where({ role: 'admin' }).count('id as count').first();
    res.json({ bootstrapped: parseInt(count.count) > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check bootstrap status' });
  }
}

/**
 * POST /auth/register-brand
 * Create a new Organization and its first Admin.
 */
export async function registerBrand(req, res) {
  const trx = await pg.transaction();
  try {
    const { email, phone, companyName } = req.body;

    // 1. Create Organization
    const orgTokenId = `org_${nanoid(12)}`;
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const [org] = await trx('organizations').insert({
      org_token_id: orgTokenId,
      name: companyName,
      slug
    }).returning('*');

    // 2. Create Admin User
    const emailHash = hashValue(email);
    const phoneHash = hashValue(phone);

    const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
    const emailEnc = encrypt(email, masterKey);
    const phoneEnc = encrypt(phone, masterKey);
    const emailPayload = JSON.parse(Buffer.from(emailEnc, 'base64').toString('utf8'));
    const phonePayload = JSON.parse(Buffer.from(phoneEnc, 'base64').toString('utf8'));

    const userTokenId = `usr_${nanoid(12)}`;

    await trx('users').insert({
      user_token_id: userTokenId,
      organization_id: org.id,
      email_cipher: emailPayload.data,
      email_iv: emailPayload.iv,
      email_tag: emailPayload.tag,
      email_hash: emailHash,
      phone_cipher: phonePayload.data,
      phone_iv: phonePayload.iv,
      phone_tag: phonePayload.tag,
      phone_hash: phoneHash,
      role: 'admin',
    });

    await trx.commit();

    // Provision UEK (non-transactional usually, or handles its own if using PG)
    await provisionUserKey(userTokenId);

    res.status(201).json({
      message: 'Brand registered successfully',
      org_token_id: orgTokenId,
      user_token_id: userTokenId
    });
  } catch (err) {
    await trx.rollback();
    console.error('Register brand error:', err.message);
    res.status(500).json({ error: 'Brand registration failed' });
  }
}

/**
 * POST /users/create
 * Register a new user — encrypts PII, returns only user_token_id.
 */
export async function createUser(req, res) {
  try {
    const { name, email, phone, role = 'user', organization_token_id } = req.body;
    
    // Resolve organization
    let orgId;
    if (organization_token_id) {
      const org = await pg('organizations').where({ org_token_id: organization_token_id }).first();
      if (!org) return res.status(404).json({ error: 'Organization not found' });
      orgId = org.id;
    } else if (req.user?.org_id) {
      // If admin is creating, use admin's org directly from session
      orgId = req.user.org_id;
    } else {
      // Default org for legacy/public customers
      const org = await pg('organizations').where({ org_token_id: 'org_default001' }).first();
      orgId = org.id;
    }

    // ─── Restricted Onboarding Logic ───
    const adminCount = await pg('users')
      .where({ organization_id: orgId, role: 'admin' })
      .count('id as count').first();
    const isBootstrapped = parseInt(adminCount.count) > 0;

    const allowedRoles = ['user', 'merchant', 'admin'];
    let finalRole = allowedRoles.includes(role) ? role : 'user';

    if (isBootstrapped) {
      if (finalRole === 'admin' || finalRole === 'merchant') {
        if (!req.user || req.user.role !== 'admin' || req.user.org_token_id !== organization_token_id) {
          // Note: check req.user.org_token_id against organization_token_id if provided
          return res.status(403).json({ 
            error: 'Privileged role registration requires an Administrator session for this organization.' 
          });
        }
      }
    }

    const emailHash = hashValue(email);
    const phoneHash = hashValue(phone);

    const existing = await pg('users')
      .where({ email_hash: emailHash, organization_id: orgId })
      .first();

    if (existing) {
      return res.status(409).json({ 
        error: 'User already exists in this organization',
        user_token_id: existing.user_token_id 
      });
    }

    const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
    const emailEnc = encrypt(email, masterKey);
    const phoneEnc = encrypt(phone, masterKey);
    const nameEnc = name ? encrypt(name, masterKey) : null;

    const emailPayload = JSON.parse(Buffer.from(emailEnc, 'base64').toString('utf8'));
    const phonePayload = JSON.parse(Buffer.from(phoneEnc, 'base64').toString('utf8'));
    const namePayload = nameEnc ? JSON.parse(Buffer.from(nameEnc, 'base64').toString('utf8')) : null;

    const userTokenId = `usr_${nanoid(12)}`;

    await pg('users').insert({
      user_token_id: userTokenId,
      organization_id: orgId,
      name_cipher: namePayload?.data,
      name_iv: namePayload?.iv,
      name_tag: namePayload?.tag,
      name_hash: name ? hashValue(name) : null,
      email_cipher: emailPayload.data,
      email_iv: emailPayload.iv,
      email_tag: emailPayload.tag,
      email_hash: emailHash,
      phone_cipher: phonePayload.data,
      phone_iv: phonePayload.iv,
      phone_tag: phonePayload.tag,
      phone_hash: phoneHash,
      role: finalRole,
    });

    await provisionUserKey(userTokenId);

    // Cache in Redis
    await redis.setex(`user_cache:${userTokenId}`, 60, JSON.stringify({
      user_token_id: userTokenId,
      role: finalRole,
      organization_id: orgId
    }));

    // Audit log
    await logAccess({
      user_token_id: userTokenId,
      action: 'REGISTER',
      fields: ['email_hash', 'phone_hash'],
      ip: req.ip,
      device_fingerprint: req.deviceInfo?.fingerprint,
    });

    res.status(201).json({
      user_token_id: userTokenId,
      message: 'Registration successful',
    });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
}


/**
 * GET /users/:token
 * Return non-sensitive profile fields only.
 */
export async function getUser(req, res) {
  try {
    const { token } = req.params;

    // Check Redis cache first
    const cached = await redis.get(`user_cache:${token}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const user = await pg('users')
      .where({ user_token_id: token, is_deleted: false })
      .select(
        'user_token_id', 'role', 'created_at',
        'name_cipher', 'name_iv', 'name_tag',
        'email_cipher', 'email_iv', 'email_tag',
        'phone_cipher', 'phone_iv', 'phone_tag'
      )
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requesterRole = req.user.role;
    const isAdminOrMerchant = requesterRole === 'admin' || requesterRole === 'merchant';
    const isSelf = req.user.user_token_id === token;

    let responseData = {
      user_token_id: user.user_token_id,
      role: user.role,
      created_at: user.created_at
    };

    if (isAdminOrMerchant || isSelf) {
      // Return DECRYPTED data
      const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
      try {
        if (user.name_cipher) {
          responseData.name = decrypt(Buffer.from(JSON.stringify({
            data: user.name_cipher,
            iv: user.name_iv,
            tag: user.name_tag
          })).toString('base64'), masterKey);
        }
        if (user.email_cipher) {
          responseData.email = decrypt(Buffer.from(JSON.stringify({
            data: user.email_cipher,
            iv: user.email_iv,
            tag: user.email_tag
          })).toString('base64'), masterKey);
        }
        if (user.phone_cipher) {
          responseData.phone = decrypt(Buffer.from(JSON.stringify({
            data: user.phone_cipher,
            iv: user.phone_iv,
            tag: user.phone_tag
          })).toString('base64'), masterKey);
        }
      } catch (err) {
        console.warn('Decryption failed for user profile:', err.message);
      }
    } else {
      // Return ENCRYPTED data (gibberish for "hackers")
      responseData.name = user.name_cipher ? `[encrypted]_${user.name_cipher.slice(0, 16)}...` : null;
      responseData.email = `[encrypted]_${user.email_cipher.slice(0, 16)}...`;
      responseData.phone = `[encrypted]_${user.phone_cipher.slice(0, 16)}...`;
    }

    // Cache for 60s
    await redis.setex(`user_cache:${token}`, 60, JSON.stringify(responseData));

    res.json(responseData);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
}

/**
 * DELETE /users/:token
 * Soft delete — retains anonymized audit record.
 */
export async function deleteUser(req, res) {
  try {
    const { token } = req.params;

    // Only allow self-deletion
    if (req.user.user_token_id !== token && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updated = await pg('users')
      .where({ user_token_id: token })
      .update({ is_deleted: true, updated_at: new Date() });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear user data cache AND encryption key cache
    await redis.del(`user_cache:${token}`);
    await redis.del(`uek:${token}`);
    // Audit log
    await logAccess({
      user_token_id: token,
      action: 'DELETE',
      ip: req.ip,
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Deletion failed' });
  }
}
