import { verifyAccessToken } from '../../modules/auth/auth.service.js';
import { verifyApiKey } from '../../modules/security/apiKey.service.js';

export async function authenticate(req, res, next) {
  // 1. Try Session Cookie (Browser)
  const token = req.cookies?.access_token;
  
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = { 
        user_token_id: decoded.user_token_id, 
        role: decoded.role, 
        org_token_id: decoded.org_token_id,
        org_id: decoded.org_id,
        auth_type: 'session' 
      };
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      // If token is invalid, don't return yet, try API key
    }
  }

  // 2. Try API Key (SDK/Server)
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    try {
      const keyInfo = await verifyApiKey(apiKey);
      if (keyInfo) {
        req.user = { 
          user_token_id: keyInfo.user_token_id, 
          role: 'merchant', // API keys are generally for merchant/sdk access
          org_token_id: keyInfo.org_token_id,
          org_id: keyInfo.org_id,
          auth_type: 'api_key',
          scopes: keyInfo.scopes
        };
        return next();
      }
    } catch (err) {
      console.error('API Key verification error:', err);
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
}

/**
 * Optional authentication middleware.
 * Populates req.user if a valid token/key is present, but doesn't fail if absent.
 */
export async function optionalAuthenticate(req, res, next) {
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = { 
        user_token_id: decoded.user_token_id, 
        role: decoded.role, 
        org_token_id: decoded.org_token_id,
        org_id: decoded.org_id,
        auth_type: 'session' 
      };
      return next();
    } catch (err) {
      // Ignore invalid/expired tokens in optional auth
    }
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    try {
      const keyInfo = await verifyApiKey(apiKey);
      if (keyInfo) {
        req.user = { 
          user_token_id: keyInfo.user_token_id, 
          role: 'merchant',
          org_token_id: keyInfo.org_token_id,
          org_id: keyInfo.org_id,
          auth_type: 'api_key',
          scopes: keyInfo.scopes
        };
        return next();
      }
    } catch (err) {
      // Ignore
    }
  }

  next();
}
