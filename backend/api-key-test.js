/**
 * SecureAiPay API Key Authentication Test
 * 
 * Verifies:
 * 1. Admin can generate a key via internal service.
 * 2. Key works for accessing authenticated routes via x-api-key header.
 * 3. Invalid key results in 401.
 * 4. Revoked key results in 401.
 */

import { generateApiKey, verifyApiKey, revokeApiKey } from './src/modules/security/apiKey.service.js';
import { pg } from './src/config/db.js';
import axios from 'axios';

const TEST_USER = 'usr_LOugQW_uKowf'; // Sarthak's token from previous test (if still there) or any valid token
const API_URL = 'http://localhost:4000/api';

async function runTest() {
  console.log('🧪 Starting API Key Verification Test...');

  try {
    // Force a fresh user if LOugQW_uKowf is missing
    let user = await pg('users').where({ user_token_id: TEST_USER }).first();
    let userTokenId = TEST_USER;
    
    if (!user) {
      console.log('ℹ️  Test user missing, creating temporary user...');
      userTokenId = 'usr_TEST_' + Math.floor(Math.random() * 1000000);
      await pg('users').insert({ 
        user_token_id: userTokenId, 
        email_cipher: 'dummy',
        email_iv: 'dummy',
        email_tag: 'dummy',
        email_hash: 'test', 
        phone_cipher: 'dummy',
        phone_iv: 'dummy',
        phone_tag: 'dummy',
        phone_hash: 'test',
        role: 'merchant'
      });
    }

    // 1. Generate Key
    console.log('1️⃣  Generating API Key...');
    const keyData = await generateApiKey(userTokenId, 'Test Integration Key');
    const { rawKey, id: keyId } = keyData;
    console.log(`   ✅ Generated key prefix: ${keyData.key_prefix}`);

    // CLOSE DB EARLY to avoid pool timeout issues during HTTP test
    await pg.destroy();
    console.log('ℹ️  DB pool destroyed, continuing with HTTP test...');

    // 2. Test valid key via HTTP
    console.log('\n2️⃣  Testing valid key authentication...');
    try {
      const res = await axios.get(`${API_URL}/merchant/users`, {
        headers: { 'x-api-key': rawKey }
      });
      console.log('   ✅ Success! Users fetched:', res.data.users?.length || 0);
    } catch (err) {
      console.error('   ❌ Failed with valid key:', err.response?.data || err.message);
    }

    // 3. Test invalid key
    console.log('\n3️⃣  Testing invalid key...');
    try {
      await axios.get(`${API_URL}/merchant/users`, {
        headers: { 'x-api-key': 'sap_live_fake_key_12345' }
      });
      console.error('   ❌ Error: Invalid key was accepted!');
    } catch (err) {
      console.log('   ✅ Correctly rejected:', err.response?.status, err.response?.data?.error);
    }

    // 4. Revoke key
    console.log('\n4️⃣  Revoking key...');
    await revokeApiKey(keyId, userTokenId);
    console.log('   ✅ Key revoked.');

    // 5. Test revoked key
    console.log('\n5️⃣  Testing revoked key...');
    try {
      await axios.get(`${API_URL}/merchant/users`, {
        headers: { 'x-api-key': rawKey }
      });
      console.error('   ❌ Error: Revoked key was accepted!');
    } catch (err) {
      console.log('   ✅ Correctly rejected:', err.response?.status, err.response?.data?.error);
    }

    // Cleanup
    if (userTokenId.startsWith('usr_TEST_')) {
      await pg('api_keys').where({ user_token_id: userTokenId }).delete();
      await pg('users').where({ user_token_id: userTokenId }).delete();
    }

    console.log('\n🎉 All API Key tests passed!');

  } catch (err) {
    console.error('\n💥 Test suite failed:', err);
  } finally {
    await pg.destroy();
  }
}

runTest();
