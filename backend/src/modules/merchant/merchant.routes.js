import { Router } from 'express';
import { mapToken, getMappedUsers, getTransactions, createTransaction } from './merchant.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireRole } from '../../common/middleware/rbac.middleware.js';
import { validateMerchantMap } from '../../common/middleware/validator.middleware.js';

const router = Router();

// POST /api/merchant/map — Map token
router.post('/map', authenticate, requireRole('merchant', 'admin'), validateMerchantMap, mapToken);

// GET /api/merchant/users — List mapped users
router.get('/users', authenticate, requireRole('merchant', 'admin'), getMappedUsers);

// GET /api/merchant/transactions/:user_token — Transaction history
router.get('/transactions/:user_token', authenticate, requireRole('merchant', 'admin'), getTransactions);

// POST /api/merchant/transaction — New payment with AI scoring
router.post('/transaction', authenticate, requireRole('merchant', 'admin'), createTransaction);

export default router;
