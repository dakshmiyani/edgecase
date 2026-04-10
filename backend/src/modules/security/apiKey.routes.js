import express from 'express';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import * as apiKeyController from './apiKey.controller.js';

const router = express.Router();

// All API key management routes require authentication
router.use(authenticate);

router.get('/', apiKeyController.getKeys);
router.post('/', apiKeyController.createKey);
router.delete('/:id', apiKeyController.revokeKey);

export default router;
