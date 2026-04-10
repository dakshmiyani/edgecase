import express from 'express';
import { body } from 'express-validator';
import { handleValidation as validate } from '../../common/middleware/validator.middleware.js';
import { pg } from '../../config/db.js';
import { logAccess } from '../audit-log/access-audit.service.js';

const router = express.Router();

/**
 * 🚨 INTERNAL ONLY: Automated Block from AI Engine
 */
router.post(
  '/block',
  [
    body('user_token_id').isString(),
    body('reason').isString(),
  ],
  validate,
  async (req, res) => {
    const { user_token_id, reason } = req.body;
    
    try {
      // Update user status
      await pg('users').where({ user_token_id }).update({ status: 'blocked' });
      
      // Audit the block
      await logAccess({
        user_token_id,
        action: 'BLOCK',
        fields: ['status'],
        explanation: `AI Engine automated block: ${reason}`,
      });

      console.log(`🚨 AI ACTION: Account ${user_token_id} blocked.`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Block action failed' });
    }
  }
);

/**
 * 🔐 INTERNAL ONLY: Automated OTP Challenge from AI Engine
 */
router.post(
  '/otp-challenge',
  [
    body('user_token_id').isString(),
  ],
  validate,
  async (req, res) => {
    const { user_token_id } = req.body;
    
    // In a real app, this would set a "needs_otp" flag on the user's active session
    console.log(`🔐 AI ACTION: OTP Challenge required for ${user_token_id}`);
    res.json({ success: true, challenge_id: 'auto_otp_123' });
  }
);

export default router;
