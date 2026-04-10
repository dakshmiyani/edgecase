import { 
  getSystemHealth, getAnomalies, getAdminLogs, 
  getDecisionStats, getRealtimeAlerts, getSystemUsers,
  addTeamMember
} from './admin.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireRole } from '../../common/middleware/rbac.middleware.js';
import { Router } from 'express';
const router = Router();

// All admin routes require admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/health — System health
router.get('/health', getSystemHealth);

// GET /api/admin/anomalies — Anomaly alerts
router.get('/anomalies', getAnomalies);

// GET /api/admin/users — List system users
router.get('/users', getSystemUsers);

// POST /api/admin/users — Add a new team member
router.post('/users', addTeamMember);

// GET /api/admin/logs — System-wide audit logs
router.get('/logs', getAdminLogs);

export default router;
