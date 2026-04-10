import { Router } from 'express';
import { createTransaction, verifyTransaction } from './transaction.controller.js';
import { enforceIdempotency } from '../../common/middleware/idempotency.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/transaction/create
 * Protected by CSRF (global) + Idempotency Gate.
 * Auth is attempted but not enforced here to allow demo usage.
 * Actual identity binding is done inside the service.
 */
router.post('/create', authenticate, enforceIdempotency, createTransaction);

/**
 * POST /api/transaction/verify
 * REQUIRES authentication — decryption only runs for the verified key owner.
 */
router.post('/verify', authenticate, verifyTransaction);

export default router;
