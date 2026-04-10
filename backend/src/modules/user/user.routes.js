import { createUser, getUser, deleteUser, getBootstrapStatus } from './user.controller.js';
import { authenticate, optionalAuthenticate } from '../../common/middleware/auth.middleware.js';
import { deviceFingerprint } from '../../common/middleware/device-fingerprint.middleware.js';
import { validateRegistration } from '../../common/middleware/validator.middleware.js';
import { Router } from 'express';
const router = Router();

// GET /api/users/bootstrap-status — Public check
router.get('/bootstrap-status', getBootstrapStatus);

// POST /api/users/create — Public or Admin-led registration
router.post('/create', authenticate, deviceFingerprint, validateRegistration, createUser);

// GET /api/users/:token — Requires auth
router.get('/:token', authenticate, getUser);

// DELETE /api/users/:token — Requires auth
router.delete('/:token', authenticate, deleteUser);

export default router;
