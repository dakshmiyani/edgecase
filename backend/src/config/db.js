import knex from 'knex';
import mongoose from 'mongoose';
import env from './env.js';

// ─── PostgreSQL via Knex ───
export const pg = knex({
  client: 'pg',
  connection: {
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  },
  pool: { min: 2, max: 50 },
});

// ─── MongoDB via Mongoose ───
export async function connectMongo() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
  }
}

// ─── Verify PostgreSQL ───
export async function connectPg() {
  try {
    await pg.raw('SELECT 1');
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
}
