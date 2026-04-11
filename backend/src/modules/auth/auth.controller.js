import { pg } from '../../config/db.js';
import { hashValue, decrypt } from '../../common/utils/encryption.js';
import { generateOTP, verifyOTP } from './otp.service.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, invalidateSession } from './auth.service.js';
import { registerDevice } from '../../common/middleware/device-fingerprint.middleware.js';
import { logAccess } from '../audit-log/access-audit.service.js';
import { evictUserKey } from '../security/key.service.js';
import env from '../../config/env.js';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax', // Changed from strict to allow cookie sharing on localhost cross-port
  path: '/',
};

/**
 * POST /auth/otp/send
 * Send OTP to user's email or phone.
 */
export async function sendOTP(req, res) {
  try {
    const { identifier } = req.body;
    const identifierHash = hashValue(identifier);

    // Look up user by email or phone hash
    const user = await pg('users')
      .where({ email_hash: identifierHash, is_deleted: false })
      .orWhere({ phone_hash: identifierHash, is_deleted: false })
      .select('user_token_id')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { otp, remaining } = await generateOTP(user.user_token_id);

    // Demo mode: log OTP to console
    if (env.OTP_MODE === 'demo') {
      console.log(`📱 [DEMO OTP] for ${user.user_token_id}: ${otp}`);
    }
    // TODO: In production mode, send via Twilio/SendGrid

    // Check device recognition
    const isKnownDevice = req.deviceInfo?.recognized || false;

    res.json({
      user_token_id: user.user_token_id,
      message: 'OTP sent',
      remaining_attempts: remaining,
      device_recognized: isKnownDevice,
    });
  } catch (err) {
    if (err.message.includes('rate limit')) {
      return res.status(429).json({ error: err.message });
    }
    console.error('Send OTP error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

/**
 * POST /auth/otp/verify
 * Verify OTP and issue JWT tokens in HttpOnly cookies.
 */
export async function verifyOTPHandler(req, res) {
  try {
    const { user_token_id, otp } = req.body;

    const isValid = await verifyOTP(user_token_id, otp);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Get user role and organization
    const user = await pg('users as u')
      .join('organizations as o', 'u.organization_id', 'o.id')
      .where({ 'u.user_token_id': user_token_id, 'u.is_deleted': false })
      .select(
        'u.role', 'u.organization_id', 'o.org_token_id', 'o.name as brand_name',
        'u.name_cipher', 'u.name_iv', 'u.name_tag'
      )
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let name = null;
    if (user.name_cipher) {
      try {
        const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
        name = decrypt(Buffer.from(JSON.stringify({
          data: user.name_cipher,
          iv: user.name_iv,
          tag: user.name_tag
        })).toString('base64'), masterKey);
      } catch (err) {
        console.warn('Name decryption failed at login:', err.message);
      }
    }

    const payload = { 
      user_token_id, 
      role: user.role,
      org_id: user.organization_id,
      org_token_id: user.org_token_id
    };

    // Sign tokens
    const accessToken = signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // Register device as known
    if (req.deviceInfo?.fingerprint) {
      await registerDevice(user_token_id, req.deviceInfo.fingerprint);
    }

    // Set HttpOnly cookies
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Audit log
    await logAccess({
      user_token_id,
      action: 'LOGIN',
      ip: req.ip,
      device_fingerprint: req.deviceInfo?.fingerprint,
    });

    res.json({
      message: 'Authentication successful',
      user_token_id,
      role: user.role,
      name: name || user.role,
      brand: user.brand_name,
      org_token_id: user.org_token_id
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * POST /auth/refresh
 * Validate refresh token, issue new access token.
 */
export async function refreshAuth(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Fetch latest role and organization from DB
    const user = await pg('users as u')
      .join('organizations as o', 'u.organization_id', 'o.id')
      .where({ 'u.user_token_id': decoded.user_token_id, 'u.is_deleted': false })
      .select(
        'u.role', 'u.organization_id', 'o.org_token_id', 'o.name as brand_name',
        'u.name_cipher', 'u.name_iv', 'u.name_tag'
      )
      .first();

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    let name = null;
    if (user.name_cipher) {
      try {
        const masterKey = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex');
        name = decrypt(Buffer.from(JSON.stringify({
          data: user.name_cipher,
          iv: user.name_iv,
          tag: user.name_tag
        })).toString('base64'), masterKey);
      } catch (err) {
        console.warn('Name decryption failed at refresh:', err.message);
      }
    }

    const accessToken = signAccessToken({
      user_token_id: decoded.user_token_id,
      role: user.role,
      org_id: user.organization_id,
      org_token_id: user.org_token_id
    });

    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTS,
      maxAge: 15 * 60 * 1000,
    });

    res.json({ 
      message: 'Token refreshed',
      user_token_id: decoded.user_token_id,
      role: user.role,
      name: name || user.role,
      brand: user.brand_name,
      org_token_id: user.org_token_id
    });
  } catch (err) {
    console.error('Refresh error:', err.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
}

/**
 * POST /auth/logout
 * Invalidate refresh token and clear cookies.
 */
export async function logout(req, res) {
  try {
    if (req.user?.user_token_id) {
      await invalidateSession(req.user.user_token_id);
      // ─── Security: evict UEK from Redis so no key material lingers after logout ───
      await evictUserKey(req.user.user_token_id);
    }

    res.clearCookie('access_token', COOKIE_OPTS);
    res.clearCookie('refresh_token', COOKIE_OPTS);

    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ error: 'Logout failed' });
  }
}
