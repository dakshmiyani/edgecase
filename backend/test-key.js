import { pg } from './src/config/db.js';
import { generateApiKey } from './src/modules/security/apiKey.service.js';

async function test() {
  try {
    const user = await pg('users').first();
    console.log('Testing with user:', user.user_token_id, user.organization_id);
    const key = await generateApiKey(user.user_token_id, user.organization_id, 'Test Key', 'live');
    console.log('Key generated:', key);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

test();
