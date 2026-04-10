import { pg, connectMongo } from './src/config/db.js';
import * as userController from './src/modules/user/user.controller.js';
import * as merchantController from './src/modules/merchant/merchant.controller.js';
import * as apiKeyController from './src/modules/security/apiKey.controller.js';
import { generateApiKey } from './src/modules/security/apiKey.service.js';

async function runTest() {
  await connectMongo();
  console.log('🚀 Setting up Multi-Tenant Brands...');

  // Helper to simulate request object
  const mockReq = (body, user) => ({ body, user: user || {}, ip: '127.0.0.1' });
  const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  try {
    // ─── 1. Register Brand A ───
    console.log('\n--- 1. Registering Brand A ---');
    const resA = mockRes();
    await userController.registerBrand(mockReq({ 
      email: 'adminA@brand.test', 
      phone: '+100A', 
      companyName: 'Brand A' 
    }), resA);
    const orgA = resA.data.org_token_id;
    const adminA = resA.data.user_token_id;
    console.log(`✅ Brand A Registered: Org=${orgA}, Admin=${adminA}`);
    
    // Get primary DB ID for Org A
    const orgRecordA = await pg('organizations').where({ org_token_id: orgA }).first();
    const orgIdA = orgRecordA.id;

    // ─── 2. Register Brand B ───
    console.log('\n--- 2. Registering Brand B ---');
    const resB = mockRes();
    await userController.registerBrand(mockReq({ 
      email: 'adminB@brand.test', 
      phone: '+100B', 
      companyName: 'Brand B' 
    }), resB);
    const orgB = resB.data.org_token_id;
    const adminB = resB.data.user_token_id;
    console.log(`✅ Brand B Registered: Org=${orgB}, Admin=${adminB}`);

    const orgRecordB = await pg('organizations').where({ org_token_id: orgB }).first();
    const orgIdB = orgRecordB.id;

    // ─── 3. Admins Create Customers ───
    console.log('\n--- 3. Provisioning Customers ---');
    const resUserA = mockRes();
    await userController.createUser(mockReq({
      email: 'customerA@domain.test', phone: '+123A', role: 'user'
    }, { role: 'admin', org_id: orgIdA }), resUserA);
    const customerA = resUserA.data.user_token_id;
    console.log(`✅ Customer A created in Brand A: ${customerA}`);

    const resUserB = mockRes();
    await userController.createUser(mockReq({
      email: 'customerB@domain.test', phone: '+123B', role: 'user'
    }, { role: 'admin', org_id: orgIdB }), resUserB);
    const customerB = resUserB.data.user_token_id;
    console.log(`✅ Customer B created in Brand B: ${customerB}`);

    // ─── 4. Admin A Maps Customer A ───
    // Assume Admin plays Merchant role for simplicity of testing the mapping endpoint
    console.log('\n--- 4. Mapping Customers ---');
    const resMapA = mockRes();
    await merchantController.mapToken(mockReq({
      user_token_id: customerA, merchant_user_id: 'internal_A_001'
    }, { user_token_id: adminA, org_id: orgIdA }), resMapA);
    console.log(`✅ Brand A Mapped Customer A: ${resMapA.statusCode}`);

    // ─── 5. ISOLATION TEST: Brand B tries to Map Customer A ───
    console.log('\n--- 5. Security Test: Cross-Brand Mapping Attack ---');
    const resMapAttack = mockRes();
    await merchantController.mapToken(mockReq({
      user_token_id: customerA, merchant_user_id: 'internal_B_hacked'
    }, { user_token_id: adminB, org_id: orgIdB }), resMapAttack);
    
    if (resMapAttack.statusCode !== 404) {
      console.error(`❌ FAILED: Brand B was able to map Brand A's customer. Status: ${resMapAttack.statusCode}`, resMapAttack.data);
    } else {
      console.log(`✅ PASSED: Brand B blocked from seeing Customer A (${resMapAttack.data.error})`);
    }

    // ─── 6. ISOLATION TEST: API Keys ───
    console.log('\n--- 6. Security Test: API Key Isolation ---');
    const keyA = await generateApiKey(adminA, orgIdA, 'Test Key A');
    
    // Simulate getting API keys for Brand B
    const keysB = await pg('api_keys').where({ organization_id: orgIdB });
    if (keysB.length === 0) {
      console.log(`✅ PASSED: Brand B has no access to Brand A's API Key.`);
    } else {
      console.error(`❌ FAILED: Brand B accessed an API Key.`);
    }

  } catch (err) {
    console.error('Test script crashed:', err);
  } finally {
    process.exit(0);
  }
}

runTest();
