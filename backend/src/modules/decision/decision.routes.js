import { Router } from 'express';
import { evaluateDecision } from './decision.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';

const router = Router();

// Internal/System usually, but public here for demo.
// In prod, this would only be callable by Layer 2 or internal L1 logic.
router.post('/evaluate', authenticate, evaluateDecision);

export default router;
