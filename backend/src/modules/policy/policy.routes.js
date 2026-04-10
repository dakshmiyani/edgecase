import { Router } from 'express';
import { getRules, createRule, updateRule, deleteRule } from './policy.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireRole } from '../../common/middleware/rbac.middleware.js';

const router = Router();

// Only Admins can manage security policies
router.get('/rules', authenticate, requireRole('admin'), getRules);
router.post('/rules', authenticate, requireRole('admin'), createRule);
router.patch('/rules/:rule_id', authenticate, requireRole('admin'), updateRule);
router.delete('/rules/:rule_id', authenticate, requireRole('admin'), deleteRule);

export default router;
