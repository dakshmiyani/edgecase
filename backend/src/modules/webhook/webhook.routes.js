import express from 'express';
import { handleRazorpayWebhook } from './webhook.controller.js';

const router = express.Router();

// Middleware to capture rawBody for webhook signature verification
router.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

router.post('/payment', handleRazorpayWebhook);

export default router;
