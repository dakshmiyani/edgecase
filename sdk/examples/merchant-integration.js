/**
 * SecureAiPay SDK — Merchant Integration Example
 *
 * Shows how a brand/company (merchant) can:
 *   1. Register and authenticate as a merchant
 *   2. Onboard 3 customers (Sarthak, Krish, Divy)
 *   3. View each customer's decrypted transaction data
 *   4. Access rate limit info
 */

import SecureAiPay, { AuthorizationError } from '../src/index.js';

const sdk = new SecureAiPay({
  apiKey: 'sap_live_your_api_key_here',
  baseUrl: 'http://localhost:4000',
  webhookSecret: 'your_webhook_secret',
});

async function run() {
  console.log('🏪 SecureAiPay — Merchant Integration Demo\n');

  // ─── STEP 1: Register Merchant ───
  console.log('1️⃣  Registering merchant...');
  const { user_token_id: merchantId } = await sdk.auth.register({
    email: 'shopease@brand.com',
    phone: '9900000001',
    role: 'merchant',
  });
  console.log(`   ✅ Merchant ID: ${merchantId}`);

  // Authenticate merchant
  await sdk.auth.sendOTP('shopease@brand.com');
  await sdk.auth.verifyOTP({ user_token_id: merchantId, otp: '123456' });
  console.log('   ✅ Merchant authenticated\n');

  // ─── STEP 2: Register Customers ───
  console.log('2️⃣  Onboarding customers...');
  const customers = [
    { name: 'Sarthak', email: 'sarthak@customer.com', phone: '9800100001' },
    { name: 'Krish',   email: 'krish@customer.com',   phone: '9800200002' },
    { name: 'Divy',    email: 'divy@customer.com',    phone: '9800300003' },
  ];

  const customerIds = {};
  for (const c of customers) {
    const { user_token_id } = await sdk.auth.register({ email: c.email, phone: c.phone });
    customerIds[c.name] = user_token_id;
    console.log(`   ✅ ${c.name} → ${user_token_id}`);
  }

  // ─── STEP 3: Map Customers to Merchant ───
  console.log('\n3️⃣  Mapping customers to merchant...');
  for (const [name, userId] of Object.entries(customerIds)) {
    await sdk.merchant.mapCustomer({
      user_token_id: userId,
      merchant_user_id: `BRAND_${name.toUpperCase()}`,
    });
    console.log(`   ✅ ${name} mapped`);
  }

  // ─── STEP 4: View All Mapped Customers ───
  console.log('\n4️⃣  Listing all mapped customers...');
  const { users, rate_limit } = await sdk.merchant.listCustomers({ page: 1, limit: 10 });
  console.log(`   Found ${users.length} customer(s) | Rate limit remaining: ${rate_limit.remaining}`);

  // ─── STEP 5: View Transactions (Decrypted) ───
  console.log('\n5️⃣  Viewing customer transactions (server-decrypted)...');
  for (const [name, userId] of Object.entries(customerIds)) {
    try {
      const { transactions } = await sdk.merchant.getCustomerTransactions(userId);
      if (transactions.length === 0) {
        console.log(`   📭 ${name}: No transactions yet`);
      } else {
        transactions.forEach(txn => {
          console.log(`   💳 ${name} | ₹${txn.amount} | ${txn.status} | ${txn.txn_id?.slice(-8)}`);
        });
      }
    } catch (err) {
      if (err instanceof AuthorizationError) {
        console.log(`   🚫 ${name}: No mapping (access denied)`);
      } else {
        console.error(`   ❌ ${name}: ${err.message}`);
      }
    }
  }

  console.log('\n✅ Merchant integration demo complete!');
}

run().catch(console.error);
