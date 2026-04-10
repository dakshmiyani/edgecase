import crypto from 'crypto';

/**
 * CSRF protection using double-submit cookie pattern.
 * 
 * - On GET requests: generates a CSRF token, sets it in a readable cookie + attaches to response.
 * - On state-mutating requests (POST/PUT/PATCH/DELETE): validates the token from
 *   the X-CSRF-Token header matches the csrf_token cookie.
 */
export function csrfProtection(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    // Generate and set CSRF token
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf_token', token, {
      httpOnly: false, // Must be readable by frontend JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.locals.csrfToken = token;
    return next();
  }

  // Skip CSRF for API requests using an API Key (SDK / Internal tools)
  if (req.headers['x-api-key']) {
    return next();
  }

  // Validate CSRF token on mutating requests
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}
