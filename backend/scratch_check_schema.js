import { pg } from './src/config/db.js';

async function checkSchema() {
  try {
    const columns = await pg('users').columnInfo();
    console.log('Users table columns:', Object.keys(columns));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkSchema();
