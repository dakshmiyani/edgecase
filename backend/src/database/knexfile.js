import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// npm sets INIT_CWD to the directory where 'npm run' was invoked (backend/)
// This is more reliable than import.meta.url when knex mutates the CWD
const projectRoot = process.env.INIT_CWD || process.cwd();
loadEnv({ path: join(projectRoot, '.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not loaded. INIT_CWD was:', projectRoot);
  process.exit(1);
}

const migrationsDir = join(projectRoot, 'src/database/migrations');
const seedsDir = join(projectRoot, 'src/database/seeds');

const knexConfig = {
  development: {
    client: 'pg',
    connection: {
      connectionString: dbUrl,
      ssl: dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: migrationsDir,
    },
    seeds: {
      directory: seedsDir,
    },
  },
};

export default knexConfig;
