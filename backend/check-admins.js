import { pg } from './src/config/db.js';

async function checkAdmins() {
  try {
    const admins = await pg('users').where({ role: 'admin' });
    console.log(`CURRENT_ADMIN_COUNT: ${admins.length}`);
  } catch (err) {
    console.error(err);
  } finally {
    await pg.destroy();
  }
}

checkAdmins();
