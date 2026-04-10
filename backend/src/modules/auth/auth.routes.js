import { Router } from 'express';
import { sendOTP, verifyOTPHandler, refreshAuth, logout } from './auth.controller.js';
import { registerBrand } from '../user/user.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { deviceFingerprint } from '../../common/middleware/device-fingerprint.middleware.js';
import { loginRateLimit } from '../../common/middleware/rate-limiter.middleware.js';
import { validateOTPSend, validateOTPVerify } from '../../common/middleware/validator.middleware.js';

const router = Router();

// POST /api/auth/register-brand — Create Organization + Admin
router.post('/register-brand', deviceFingerprint, registerBrand);

// POST /api/auth/otp/send — Send OTP
router.post('/otp/send', loginRateLimit, deviceFingerprint, validateOTPSend, sendOTP);

// POST /api/auth/otp/verify — Verify OTP
router.post('/otp/verify', loginRateLimit, deviceFingerprint, validateOTPVerify, verifyOTPHandler);

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', refreshAuth);

// POST /api/auth/logout — Logout
router.post('/logout', authenticate, logout);

export default router;
