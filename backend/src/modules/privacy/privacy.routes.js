import { Router } from 'express';
import { getPrivacyDashboard, revokeFieldAccess } from './privacy.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireRole } from '../../common/middleware/rbac.middleware.js';
import { validateRevoke } from '../../common/middleware/validator.middleware.js';

const router = Router();

// GET /api/user/privacy — Privacy dashboard
router.get('/', authenticate, requireRole('user', 'admin'), getPrivacyDashboard);

// PATCH /api/user/privacy/revoke — Revoke field access
router.patch('/revoke', authenticate, requireRole('user', 'admin'), validateRevoke, revokeFieldAccess);

export default router;
