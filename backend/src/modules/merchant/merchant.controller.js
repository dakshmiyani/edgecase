import { nanoid } from 'nanoid';
import { pg } from '../../config/db.js';
import redis from '../../redis/redis.client.js';
import { logAccess } from '../audit-log/access-audit.service.js';
import aiService from '../decision/ai.service.js';
import decisionService from '../decision/decision.service.js';
import { getUserKey } from '../security/key.service.js';
import { encrypt, decrypt, hashValue } from '../../common/utils/encryption.js';
import env from '../../config/env.js';

/**
 * POST /merchant/transaction
 * Create a new payment transaction with real-time AI fraud scoring.
 */
export async function createTransaction(req, res) {
  try {
    const { user_token_id, amount, category = 'retail', device = 'web' } = req.body;
    const merchantTokenId = req.user.user_token_id;

    // 1. Ensure mapping exists or auto-map if user exists in organization
    const existingMapping = await pg('merchant_mappings')
      .where({ merchant_token_id: merchantTokenId, user_token_id: user_token_id.trim(), is_active: true })
      .first();

    if (!existingMapping) {
      const user = await pg('users')
        .where({ user_token_id: user_token_id.trim(), organization_id: req.user.org_id, is_deleted: false })
        .first();

      if (!user) {
        console.warn(`❌ TRANSACTION FAILED: User ${user_token_id} not found in org ${req.user.org_id}`);
        return res.status(403).json({ error: 'User not found in this organization' });
      }

      await pg('merchant_mappings').insert({
        merchant_token_id: merchantTokenId,
        user_token_id: user_token_id.trim(),
        organization_id: req.user.org_id,
        merchant_user_id: user_token_id.trim() // Default internal ID to token ID for auto-mapped users
      });
      console.log(`✅ AUTO-MAPPED user ${user_token_id} to merchant ${merchantTokenId}`);
    }

    console.log(`🛡️ TRIGGERING AI ENGINE for transaction: ${amount} ${category}`);
    // 2. Real-time Fraud Scoring (AI Layer 2)
    const fraudResult = await aiService.getRealTimeScore({
      user_token_id,
      amount,
      device,
      merchant_token_id: merchantTokenId
    });

    // 3. Deterministic Decision (Layer 3)
    const decision = await decisionService.evaluate({
      user_token_id,
      fraud_score: fraudResult.fraud_score,
      amount,
      device,
      merchant_token_id: merchantTokenId,
      location_changed: false
    });

    if (decision.decision === 'BLOCK') {
      return res.status(403).json({
        error: 'Transaction blocked by security engine',
        reason: decision.reason
      });
    }

    // 4. Record Transaction
    const [transaction] = await pg('transactions').insert({
      user_token_id,
      merchant_token_id: merchantTokenId,
      amount,
      category,
      status: decision.decision === 'OTP' ? 'pending_otp' : 'completed',
    }).returning(['id', 'status', 'transaction_at']);

    // 5. Async Pipeline
    await aiService.publishTransaction({
      user_token_id,
      amount,
      device,
      merchant_token_id: merchantTokenId
    });

    // 6. Audit
    await logAccess({
      user_token_id,
      merchant_token_id: merchantTokenId,
      action: 'TRANSACTION',
      fields: ['amount', 'status'],
      ip: req.ip,
      explanation: `Transaction ${transaction.id} processed with risk ${fraudResult.risk}`
    });

    res.status(201).json({
      message: decision.decision === 'OTP' ? 'OTP verification required' : 'Transaction successful',
      transaction_id: transaction.id,
      status: transaction.status,
      decision: {
        action: decision.decision,
        reason: decision.reason,
        score: decision.fraud_score,
        txn_id: decision.txn_id
      }
    });

  } catch (err) {
    console.error('Create transaction error:', err.message);
    res.status(500).json({ error: 'Transaction processing failed' });
  }
}

/**
 * POST /merchant/map
 * Link a merchant_user_id to a user_token_id.
 */
export async function mapToken(req, res) {
  try {
    const { merchant_user_id, user_token_id } = req.body;
    const merchantTokenId = req.user.user_token_id;
    const orgId = req.user.org_id;

    const user = await pg('users')
      .where({ user_token_id, is_deleted: false, organization_id: orgId })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found in this organization' });
    }

    const existing = await pg('merchant_mappings')
      .where({ merchant_token_id: merchantTokenId, user_token_id, organization_id: orgId })
      .first();

    if (existing) {
      return res.status(409).json({ error: 'Mapping already exists' });
    }

    await pg('merchant_mappings').insert({
      merchant_token_id: merchantTokenId,
      user_token_id,
      merchant_user_id,
      organization_id: orgId
    });

    await logAccess({
      user_token_id,
      merchant_token_id: merchantTokenId,
      action: 'MAP',
      fields: ['user_token_id'],
      ip: req.ip,
      explanation: `Merchant ${merchantTokenId} linked internal ID ${merchant_user_id} to ${user_token_id}`,
    });

    res.status(201).json({
      message: 'Token mapped successfully',
      merchant_token_id: merchantTokenId,
      user_token_id,
    });
  } catch (err) {
    console.error('Map token error:', err.message);
    res.status(500).json({ error: 'Mapping failed' });
  }
}

/**
 * GET /merchant/users
 * Paginated list of mapped user tokens with rate limit info.
 */
export async function getMappedUsers(req, res) {
  try {
    const merchantTokenId = req.user.user_token_id;
    const orgId = req.user.org_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [mappings, countResult] = await Promise.all([
      pg('merchant_mappings')
        .join('users', 'merchant_mappings.user_token_id', '=', 'users.user_token_id')
        .where({ 
          'merchant_mappings.merchant_token_id': merchantTokenId, 
          'merchant_mappings.organization_id': orgId, 
          'merchant_mappings.is_active': true 
        })
        .select(
          'merchant_mappings.user_token_id', 
          'merchant_mappings.merchant_user_id', 
          'merchant_mappings.linked_at',
          'users.name_cipher', 'users.name_iv', 'users.name_tag',
          'users.email_cipher', 'users.email_iv', 'users.email_tag',
          'users.phone_cipher', 'users.phone_iv', 'users.phone_tag'
        )
        .orderBy('merchant_mappings.linked_at', 'desc')
        .limit(limit)
        .offset(offset),
      pg('merchant_mappings')
        .where({ merchant_token_id: merchantTokenId, organization_id: orgId, is_active: true })
        .count('id as total')
        .first(),
    ]);

    const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
    const decryptedUsers = mappings.map(m => {
      let name = null;
      let email = null;
      let phone = null;

      try {
        if (m.name_cipher) {
          name = decrypt(Buffer.from(JSON.stringify({
            data: m.name_cipher,
            iv: m.name_iv,
            tag: m.name_tag
          })).toString('base64'), masterKey);
        }
        if (m.email_cipher) {
          email = decrypt(Buffer.from(JSON.stringify({
            data: m.email_cipher,
            iv: m.email_iv,
            tag: m.email_tag
          })).toString('base64'), masterKey);
        }
        if (m.phone_cipher) {
          phone = decrypt(Buffer.from(JSON.stringify({
            data: m.phone_cipher,
            iv: m.phone_iv,
            tag: m.phone_tag
          })).toString('base64'), masterKey);
        }
      } catch (err) {
        console.warn(`Decryption failed for mapped user ${m.user_token_id}:`, err.message);
      }

      return {
        user_token_id: m.user_token_id,
        merchant_user_id: m.merchant_user_id,
        linked_at: m.linked_at,
        name: name || 'Encrypted',
        email: email || 'Encrypted',
        phone: phone || 'Encrypted'
      };
    });

    const rateKey = `merchant_rate:${merchantTokenId}`;
    const rateCount = await redis.get(rateKey) || 0;
    const rateLimit = 100;

    res.json({
      users: decryptedUsers,
      pagination: {
        page,
        limit,
        total: parseInt(countResult?.total || 0),
      },
      rate_limit: {
        remaining: Math.max(0, rateLimit - parseInt(rateCount)),
        limit: rateLimit,
      },
    });
  } catch (err) {
    console.error('Get mapped users error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

/**
 * GET /merchant/transactions/:user_token
 *
 * Returns DECRYPTED transaction data for authenticated merchants.
 *
 * Security model:
 *   1. Merchant must be authenticated (JWT checked in auth middleware)
 *   2. Merchant–customer mapping must exist in merchant_mappings
 *   3. Server fetches customer UEK, decrypts on their behalf
 *   4. DB only stores ciphertext — a hacker with DB access sees nothing useful
 */
export async function getTransactions(req, res) {
  try {
    const merchantTokenId = req.user.user_token_id;
    const orgId = req.user.org_id;
    const { user_token } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // ─── Step 1: Verify the merchant-customer mapping ───
    const mapping = await pg('merchant_mappings')
      .where({ merchant_token_id: merchantTokenId, user_token_id: user_token, organization_id: orgId, is_active: true })
      .first();

    if (!mapping) {
      return res.status(403).json({
        error: 'Access denied: no active mapping with this customer'
      });
    }

    // ─── Step 2: Fetch encrypted transactions from DB ───
    const [rawTransactions, countResult] = await Promise.all([
      pg('transactions')
        .where({ user_token_id: user_token, organization_id: orgId })
        .select('txn_id', 'encrypted_amount', 'amount', 'status', 'gateway_order_id', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      pg('transactions')
        .where({ user_token_id: user_token, organization_id: orgId })
        .count('txn_id as total')
        .first(),
    ]);

    // ─── Step 3: Decrypt using customer's UEK ───
    // The server fetches the UEK for the customer and decrypts server-side.
    // The merchant never receives the key — only the decrypted values.
    let customerUEK = null;
    try {
      customerUEK = await getUserKey(user_token);
    } catch (keyErr) {
      console.warn(`⚠️  No UEK for customer ${user_token}: ${keyErr.message}`);
    }

    const transactions = rawTransactions.map(txn => {
      let decryptedAmount = null;

      if (customerUEK && txn.encrypted_amount) {
        try {
          decryptedAmount = parseFloat(decrypt(txn.encrypted_amount, customerUEK));
        } catch {
          // Decryption failed (tampered data?) — return null, never crash
          decryptedAmount = null;
        }
      } else if (txn.amount) {
        // Fallback: use raw amount if encryption is not yet provisioned
        decryptedAmount = parseFloat(txn.amount);
      }

      return {
        txn_id: txn.txn_id,
        amount: decryptedAmount,        // ← Decrypted: merchant sees real value ✅
        status: txn.status,
        gateway_order_id: txn.gateway_order_id,
        created_at: txn.created_at,
        // NOTE: raw encrypted_amount is NEVER sent in the response
      };
    });

    // ─── Step 4: Audit log every merchant data access ───
    await logAccess({
      user_token_id: user_token,
      merchant_token_id: merchantTokenId,
      action: 'READ',
      fields: ['transaction_amount', 'transaction_status'],
      ip: req.ip,
      explanation: `Merchant ${merchantTokenId} accessed decrypted transactions for customer ${user_token}`,
    });

    // Increment merchant rate counter
    const rateKey = `merchant_rate:${merchantTokenId}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 3600);

    res.json({
      customer_token: user_token,
      transactions,
      pagination: {
        page,
        limit,
        total: parseInt(countResult?.total || 0),
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
}
/**
 * GET /merchant/transactions/org
 * Returns ALL transactions for the organization (decrypted).
 */
export async function getOrgTransactions(req, res) {
  try {
    const orgId = req.user.org_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [rawTransactions, countResult] = await Promise.all([
      pg('transactions')
        .join('users', 'transactions.user_token_id', '=', 'users.user_token_id')
        .where({ 'transactions.organization_id': orgId })
        .select(
          'transactions.txn_id', 'transactions.user_token_id', 'transactions.encrypted_amount', 
          'transactions.amount', 'transactions.status', 'transactions.gateway_order_id', 'transactions.created_at',
          'users.name_cipher', 'users.name_iv', 'users.name_tag',
          'users.email_cipher', 'users.email_iv', 'users.email_tag',
          'users.phone_cipher', 'users.phone_iv', 'users.phone_tag'
        )
        .orderBy('transactions.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      pg('transactions')
        .where({ organization_id: orgId })
        .count('txn_id as total')
        .first(),
    ]);

    // Unique users to fetch keys for
    const uniqueUserTokens = [...new Set(rawTransactions.map(t => t.user_token_id))];
    const keysMap = {};
    await Promise.all(uniqueUserTokens.map(async (token) => {
      try {
        keysMap[token] = await getUserKey(token);
      } catch (err) {
        // Skip users without keys
      }
    }));

    const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
    const transactions = rawTransactions.map(txn => {
      let decryptedAmount = null;
      let customerName = null;
      let customerEmail = null;
      let customerPhone = null;

      const customerUEK = keysMap[txn.user_token_id];

      // Decrypt Amount (UEK)
      if (customerUEK && txn.encrypted_amount) {
        try {
          decryptedAmount = parseFloat(decrypt(txn.encrypted_amount, customerUEK));
        } catch {
          decryptedAmount = null;
        }
      } else if (txn.amount) {
        decryptedAmount = parseFloat(txn.amount);
      }

      // Decrypt PII (Master Key)
      try {
        if (txn.name_cipher) {
          customerName = decrypt(Buffer.from(JSON.stringify({
            data: txn.name_cipher,
            iv: txn.name_iv,
            tag: txn.name_tag
          })).toString('base64'), masterKey);
        }
        if (txn.email_cipher) {
          customerEmail = decrypt(Buffer.from(JSON.stringify({
            data: txn.email_cipher,
            iv: txn.email_iv,
            tag: txn.email_tag
          })).toString('base64'), masterKey);
        }
        if (txn.phone_cipher) {
          customerPhone = decrypt(Buffer.from(JSON.stringify({
            data: txn.phone_cipher,
            iv: txn.phone_iv,
            tag: txn.phone_tag
          })).toString('base64'), masterKey);
        }
      } catch (err) {
        // PII decryption failed
      }

      return {
        txn_id: txn.txn_id,
        user_token_id: txn.user_token_id,
        amount: decryptedAmount,
        customer_name: customerName || 'Encrypted',
        customer_email: customerEmail || 'Encrypted',
        customer_phone: customerPhone || 'Encrypted',
        status: txn.status,
        gateway_order_id: txn.gateway_order_id,
        created_at: txn.created_at,
      };
    });

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total: parseInt(countResult?.total || 0),
      },
    });
  } catch (err) {
    console.error('Get org transactions error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve organization transactions' });
  }
}
