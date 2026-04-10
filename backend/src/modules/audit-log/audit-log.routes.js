import { Router } from 'express';
import { getAuditLogs, explainLog } from './audit-log.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';

const router = Router();

// GET /api/audit/logs — Paginated audit log
router.get('/logs', authenticate, getAuditLogs);

// GET /api/audit/:log_id/explain — Explain access
router.get('/:log_id/explain', authenticate, explainLog);

export default router;
