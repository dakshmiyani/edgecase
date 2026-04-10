import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import { csrfProtection } from './common/middleware/csrf.middleware.js';
import { errorMiddleware } from './common/middleware/error.middleware.js';

// ─── Module Routes ───
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import merchantRoutes from './modules/merchant/merchant.routes.js';
import auditRoutes from './modules/audit-log/audit-log.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import internalRoutes from './modules/admin/internal.routes.js';
import decisionRoutes from './modules/decision/decision.routes.js';
import policyRoutes from './modules/policy/policy.routes.js';
import privacyRoutes from './modules/privacy/privacy.routes.js';
import transactionRoutes from './modules/transaction/transaction.routes.js';
import webhookRoutes from './modules/webhook/webhook.routes.js';
import apiKeyRoutes from './modules/security/apiKey.routes.js';

const app = express();

// ─── Security ───
app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false }));
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

// ─── Webhook must be before JSON parser (needs raw body) ───
app.use('/webhook', webhookRoutes);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(csrfProtection);

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user/privacy', privacyRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/decision', decisionRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/keys', apiKeyRoutes);

// ─── Health & CSRF ───
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/api/csrf-token', (req, res) => res.json({ csrfToken: res.locals.csrfToken }));

// ─── 404 & Error Handlers ───
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorMiddleware);

export default app;
