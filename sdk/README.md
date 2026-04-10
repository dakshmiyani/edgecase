# @secureaipay/sdk

> Official JavaScript SDK for **SecureAiPay** — AI-powered, end-to-end encrypted payment processing.

[![npm](https://img.shields.io/badge/npm-%40secureaipay%2Fsdk-blue)](https://npmjs.com)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

---

## Features

- 🔐 **Zero-plaintext storage** — all sensitive data encrypted at rest with AES-256-GCM
- 🤖 **AI fraud detection** — every transaction scored in real-time
- 🧑‍💼 **Merchant access** — view your customers' decrypted data via identity-bound API
- 🔗 **Webhook verification** — HMAC-SHA256 signature verification built-in
- 📦 **TypeScript support** — full type definitions included

---

## Installation

```bash
npm install @secureaipay/sdk
```

---

## Quick Start

```js
import SecureAiPay from '@secureaipay/sdk';

const sdk = new SecureAiPay({
  apiKey: 'sap_live_xxxxxxxxxxxxxxxx',
  baseUrl: 'https://api.secureaipay.com',
  webhookSecret: 'whsec_xxxxxxxxxxxxxxxx',
});

// Register a user
const { user_token_id } = await sdk.auth.register({
  email: 'user@yourbrand.com',
  phone: '9800100001',
});

// Send OTP
await sdk.auth.sendOTP('user@yourbrand.com');

// Verify OTP → establishes session
await sdk.auth.verifyOTP({ user_token_id, otp: '482910' });

// Create a payment (amount encrypted before DB storage)
const txn = await sdk.transactions.create({
  user_token_id,
  amount: 2499.00,
});

// Wait for processing
const result = await sdk.transactions.waitForCompletion(txn.txn_id);
console.log(result.status); // 'SUCCESS'
console.log(result.amount); // 2499 ← decrypted, only for this user
```

---

## API Reference

### `sdk.auth`

| Method | Description |
|--------|-------------|
| `register({ email, phone, role? })` | Register a new user, provision encryption key |
| `sendOTP(identifier)` | Send OTP to email or phone |
| `verifyOTP({ user_token_id, otp })` | Verify OTP, start authenticated session |
| `refresh()` | Refresh access token |
| `logout()` | End session, evict encryption key from cache |

---

### `sdk.transactions`

| Method | Description |
|--------|-------------|
| `create({ user_token_id, amount })` | Initiate a payment. Amount is **encrypted before DB write** |
| `verify(txn_id)` | Get status + **decrypted amount** (owner only) |
| `waitForCompletion(txn_id, options?)` | Poll until SUCCESS/FAILED |

---

### `sdk.merchant`

| Method | Description |
|--------|-------------|
| `mapCustomer({ user_token_id, merchant_user_id })` | Link a customer to your merchant account |
| `listCustomers(options?)` | List all mapped customers |
| `getCustomerTransactions(user_token_id, options?)` | Get **decrypted** transaction history for a customer |

> **Note:** A merchant can only access data for customers they have an active mapping with. The server enforces this — there is no way to bypass it.

---

### `sdk.webhooks`

```js
// In Express:
app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const { event, payload } = sdk.webhooks.parse(
    req.body,
    req.headers['x-razorpay-signature']
  );

  switch (event) {
    case 'payment.captured':
      // fulfill order
      break;
    case 'payment.failed':
      // handle failure
      break;
  }

  res.json({ received: true });
});
```

---

## Error Handling

```js
import SecureAiPay, {
  TransactionBlockedError,
  AuthenticationError,
  WebhookVerificationError,
} from '@secureaipay/sdk';

try {
  await sdk.transactions.create({ user_token_id, amount: 50000 });
} catch (err) {
  if (err instanceof TransactionBlockedError) {
    console.log('Blocked by AI engine:', err.reason);
  } else if (err instanceof AuthenticationError) {
    console.log('Session expired — re-authenticate');
  } else {
    console.log(err.code, err.message);
  }
}
```

| Error Class | When thrown |
|---|---|
| `AuthenticationError` | Invalid/expired token |
| `AuthorizationError` | No permission / no customer mapping |
| `TransactionBlockedError` | AI engine blocked the transaction |
| `ValidationError` | Missing or invalid fields |
| `NetworkError` | Server unreachable |
| `WebhookVerificationError` | Invalid HMAC signature |

---

## Examples

```bash
# Run examples (backend must be running on :4000)
node examples/basic-payment.js
node examples/merchant-integration.js
node examples/webhook-handler.js
```

---

## Security Model

| Scenario | Result |
|---|---|
| DB leaked | Only AES-256-GCM ciphertext — unreadable |
| Authenticated user | Sees their own decrypted data only |
| Merchant with customer mapping | Sees that customer's decrypted data |
| Merchant without mapping | `403 Forbidden` |
| Wrong key / tampered data | `DECRYPTION_FAILED` — rejected |

---

## License

MIT © SecureAiPay
