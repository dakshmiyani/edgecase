import { connectPg, connectMongo } from './config/db.js';
import aiService from './modules/decision/ai.service.js';
import app from './app.js';
import env from './config/env.js';

// ─── Start Workers (side-effect imports) ───
import './modules/queue/workers/payment.worker.js';
import './modules/queue/workers/retry.worker.js';
import './modules/queue/workers/reconciliation.worker.js';

async function start() {
  try {
    await connectPg();
    await aiService.connect();
    await connectMongo();

    const server = app.listen(env.PORT, () => {
      console.log(`\n🚀 SecureAiPay API running on http://localhost:${env.PORT}`);
      console.log(`   Mode: ${env.NODE_ENV}`);
      console.log(`   OTP Mode: ${env.OTP_MODE}`);
      console.log(`   Client Origin: ${env.CLIENT_ORIGIN}\n`);
    });

    // ─── Prevent nodemon restart storms on port conflicts ───
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${env.PORT} is in use. Run: kill -9 $(lsof -ti :${env.PORT})`);
        process.exit(1);
      }
      throw err;
    });

    // ─── Graceful shutdown on SIGTERM/SIGINT ───
    const shutdown = () => {
      console.log('\n⏹  Shutting down gracefully...');
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
