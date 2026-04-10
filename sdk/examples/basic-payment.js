/**
 * SecureAiPay SDK — Basic Payment Example
 *
 * Flow:
 *  1. Register user
 *  2. Authenticate via OTP
 *  3. Create a payment
 *  4. Wait for confirmation
 */

import SecureAiPay, { TransactionBlockedError } from '../src/index.js';

// ─── Initialize SDK ───
const sdk = new SecureAiPay({
  apiKey: 'sap_live_your_api_key_here',
  baseUrl: 'http://localhost:4000',       // point to your SecureAiPay API
  webhookSecret: 'your_webhook_secret',
});

async function run() {
  try {
    // ─── 1. Register a new user ───
    console.log('1️⃣  Registering user...');
    const { user_token_id } = await sdk.auth.register({
      email: 'sarthak@yourbrand.com',
      phone: '9800112233',
    });
    console.log(`   ✅ User registered: ${user_token_id}`);

    // ─── 2. Send OTP ───
    console.log('\n2️⃣  Sending OTP...');
    await sdk.auth.sendOTP('sarthak@yourbrand.com');
    console.log('   ✅ OTP sent (check backend console in demo mode)');

    // ─── 3. Verify OTP → get session ───
    // In demo mode, OTP is printed in the backend console log
    await sdk.auth.verifyOTP({ user_token_id, otp: '123456' });
    console.log('   ✅ Authenticated');

    // ─── 4. Create payment ───
    console.log('\n3️⃣  Creating payment...');
    const txn = await sdk.transactions.create({
      user_token_id,
      amount: 2499.00,
    });
    console.log(`   ✅ Transaction initiated: ${txn.txn_id}`);
    console.log(`   Amount is now ENCRYPTED in the database`);

    // ─── 5. Wait for Razorpay order to be created ───
    console.log('\n4️⃣  Waiting for payment processing...');
    const result = await sdk.transactions.waitForCompletion(txn.txn_id);
    console.log(`   ✅ Final status: ${result.status}`);
    console.log(`   ✅ Amount (decrypted for you): ₹${result.amount}`);

  } catch (err) {
    if (err instanceof TransactionBlockedError) {
      console.error(`🚫 Transaction blocked: ${err.reason}`);
    } else {
      console.error(`❌ Error: ${err.message}`);
    }
  }
}

run();
