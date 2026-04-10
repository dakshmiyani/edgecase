import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Book, Code, Shield, Zap, ChevronRight, Terminal, Copy, Check,
  ArrowLeft, ArrowRight, ExternalLink, Package, Key, CreditCard,
  Webhook, Users, Lock, Search
} from 'lucide-react';

const SIDEBAR = [
  {
    section: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction', icon: Book },
      { id: 'quickstart', label: 'Quick Start', icon: Zap },
      { id: 'installation', label: 'Installation', icon: Package },
    ]
  },
  {
    section: 'SDK Reference',
    items: [
      { id: 'auth', label: 'Authentication', icon: Key },
      { id: 'transactions', label: 'Transactions', icon: CreditCard },
      { id: 'merchant', label: 'Merchant API', icon: Users },
      { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    ]
  },
  {
    section: 'Security',
    items: [
      { id: 'encryption', label: 'Encryption Model', icon: Lock },
      { id: 'errors', label: 'Error Handling', icon: Shield },
    ]
  }
];

function CodeBlock({ code, language = 'js' }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-xs text-white/30 font-mono">{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-white/30 hover:text-white/70 transition-colors flex items-center gap-1 text-xs"
        >
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="px-5 py-4 text-sm text-white/80 overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DocSection({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">{title}</h2>
      <div className="space-y-4 text-white/60 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function PropRow({ name, type, required, description }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-4">
        <code className="text-violet-400 text-xs font-mono">{name}</code>
        {required && <span className="ml-1.5 text-[10px] text-red-400">required</span>}
      </td>
      <td className="py-3 pr-4">
        <code className="text-cyan-400 text-xs font-mono">{type}</code>
      </td>
      <td className="py-3 text-xs text-white/50">{description}</td>
    </tr>
  );
}

const CONTENT = {
  introduction: (
    <>
      <DocSection title="Introduction">
        <p>
          SecureAiPay is an AI-powered, end-to-end encrypted payment processing platform.
          All sensitive data is encrypted at rest using <strong className="text-white">AES-256-GCM</strong> with per-user encryption keys —
          zero plaintext exposure even if the database is compromised.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {[
            { icon: Shield, label: 'AES-256-GCM Encryption', desc: 'Per-user keys, master key wrapping' },
            { icon: Zap, label: 'AI Fraud Detection', desc: 'Real-time scoring on every transaction' },
            { icon: Lock, label: 'Zero Plaintext DB', desc: 'Hackers only see ciphertext' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <Icon className="w-5 h-5 text-violet-400 mb-2" />
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-white/40 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </>
  ),

  quickstart: (
    <>
      <DocSection title="Quick Start">
        <p>Get your first payment running in 5 minutes.</p>
        <p className="text-xs text-white/40">1. Generate an API Key in your <strong className="text-white">Merchant Dashboard &gt; Developer</strong> tab.</p>
        <CodeBlock language="bash" code={`npm install @secureaipay/sdk`} />
        <CodeBlock code={`import SecureAiPay from '@secureaipay/sdk';

const sdk = new SecureAiPay({
  apiKey: 'sap_live_your_key_here', // Header: x-api-key
  baseUrl: 'https://api.secureaipay.com',
});

// 1. Register user
const { user_token_id } = await sdk.auth.register({
  email: 'sarthak@example.com',
  phone: '9800100001',
});

// 2. Authenticate via OTP
await sdk.auth.sendOTP('sarthak@example.com');
await sdk.auth.verifyOTP({ user_token_id, otp: '482910' });

// 3. Create payment (amount encrypted before DB write)
const txn = await sdk.transactions.create({
  user_token_id,
  amount: 2499.00,
});

// 4. Wait for result
const result = await sdk.transactions.waitForCompletion(txn.txn_id);
console.log(\`Status: \${result.status} | Amount: ₹\${result.amount}\`);`} />
      </DocSection>
    </>
  ),

  installation: (
    <>
      <DocSection title="Installation">
        <p>Install via npm, yarn, or pnpm:</p>
        <CodeBlock language="bash" code={`# npm
npm install @secureaipay/sdk

# yarn
yarn add @secureaipay/sdk

# pnpm
pnpm add @secureaipay/sdk`} />
        <p>Then initialize the SDK with your API key:</p>
        <CodeBlock code={`import SecureAiPay from '@secureaipay/sdk';

const sdk = new SecureAiPay({
  apiKey: process.env.SECUREAIPAY_API_KEY,
  baseUrl: 'https://api.secureaipay.com',
  webhookSecret: process.env.SECUREAIPAY_WEBHOOK_SECRET,
  timeout: 15000, // optional, default: 15s
});`} />
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 my-4">
          <p className="text-amber-400 text-xs font-semibold mb-1">⚠️ Never expose your API key client-side</p>
          <p className="text-white/50 text-xs">Always use environment variables. Never commit your API key to version control.</p>
        </div>
      </DocSection>
    </>
  ),

  auth: (
    <>
      <DocSection title="Authentication">
        <p>SecureAiPay uses OTP-based, passwordless authentication. All sessions are JWT-backed with HttpOnly cookies.</p>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">sdk.auth.register()</h3>
        <CodeBlock code={`const { user_token_id } = await sdk.auth.register({
  email: 'user@brand.com',
  phone: '9800100001',
  role: 'user', // 'user' | 'merchant' | 'admin'
});`} />
        <table className="w-full text-sm mt-2">
          <thead><tr className="border-b border-white/10 text-xs text-white/40"><th className="text-left py-2 pr-4">Parameter</th><th className="text-left py-2 pr-4">Type</th><th className="text-left py-2">Description</th></tr></thead>
          <tbody>
            <PropRow name="email" type="string" required description="User's email address" />
            <PropRow name="phone" type="string" required description="Phone number (digits only)" />
            <PropRow name="role" type="string" description="Default: 'user'" />
          </tbody>
        </table>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">sdk.auth.verifyOTP()</h3>
        <CodeBlock code={`await sdk.auth.sendOTP('user@brand.com');

const session = await sdk.auth.verifyOTP({
  user_token_id: 'usr_abc123',
  otp: '482910',
});
// Returns: { message, user_token_id, role }`} />

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">sdk.auth.logout()</h3>
        <CodeBlock code={`await sdk.auth.logout();
// Clears JWT cookies + evicts encryption key from server cache`} />
      </DocSection>
    </>
  ),

  transactions: (
    <>
      <DocSection title="Transactions">
        <p>Every transaction amount is <strong className="text-white">encrypted before DB storage</strong> using the user's AES-256 key. Only the authenticated session owner can decrypt it.</p>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">sdk.transactions.create()</h3>
        <CodeBlock code={`const txn = await sdk.transactions.create({
  user_token_id: 'usr_abc123',
  amount: 2499.00,        // encrypted at rest
  currency: 'INR',        // optional, default: INR
});
// Returns: { txn_id, status: 'INITIATED', message }`} />

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">sdk.transactions.verify()</h3>
        <CodeBlock code={`const txn = await sdk.transactions.verify('d041fa67-...');
// Returns decrypted amount ONLY for the session owner:
// { txn_id, status, amount: 2499, gateway_order_id }`} />

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">sdk.transactions.waitForCompletion()</h3>
        <CodeBlock code={`const result = await sdk.transactions.waitForCompletion(txn.txn_id, {
  intervalMs: 2000,   // poll every 2s
  maxAttempts: 15,    // timeout after 30s
});
// Resolves when status is SUCCESS or FAILED`} />
      </DocSection>
    </>
  ),

  merchant: (
    <>
      <DocSection title="Merchant API">
        <p>As a merchant, you can view <strong className="text-white">decrypted transaction data</strong> for any customer you've mapped. The server enforces merchant–customer mapping before decrypting.</p>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Map a Customer</h3>
        <CodeBlock code={`await sdk.merchant.mapCustomer({
  user_token_id: 'usr_abc123',
  merchant_user_id: 'YOUR_INTERNAL_ID',
});`} />

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Get Customer Transactions (Decrypted)</h3>
        <CodeBlock code={`const { transactions } = await sdk.merchant.getCustomerTransactions('usr_abc123', {
  page: 1,
  limit: 20,
});

transactions.forEach(txn => {
  console.log(\`₹\${txn.amount} — \${txn.status}\`);
  // Output: ₹2499.00 — SUCCESS
  // (decrypted server-side, you never get the key)
});`} />

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 my-4">
          <p className="text-violet-400 text-xs font-semibold mb-1">🔐 Security Note</p>
          <p className="text-white/50 text-xs">
            You never receive the customer's encryption key. The server decrypts on your behalf
            after verifying the merchant-customer mapping. The database only ever contains ciphertext.
          </p>
        </div>
      </DocSection>
    </>
  ),

  webhooks: (
    <>
      <DocSection title="Webhooks">
        <p>Receive real-time payment events with HMAC-SHA256 signature verification.</p>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 my-4">
          <p className="text-amber-400 text-xs font-semibold mb-1">⚠️ Use raw body parser</p>
          <p className="text-white/50 text-xs">Signature verification requires the raw request body. Use <code className="text-white/70">express.raw()</code>, not <code className="text-white/70">express.json()</code>, for webhook routes.</p>
        </div>

        <CodeBlock code={`import express from 'express';
import SecureAiPay, { WebhookVerificationError } from '@secureaipay/sdk';

const sdk = new SecureAiPay({ apiKey: '...', webhookSecret: '...' });
const app = express();

app.post('/webhooks/payment',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    try {
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
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
      res.status(500).json({ error: 'Webhook error' });
    }
  }
);`} />
      </DocSection>
    </>
  ),

  encryption: (
    <>
      <DocSection title="Encryption Model">
        <p>SecureAiPay uses a <strong className="text-white">hybrid two-layer encryption architecture</strong>:</p>
        <div className="my-6 space-y-3">
          {[
            { step: '1', title: 'Master Key (server-only)', desc: 'Stored in environment variables. Used to wrap per-user keys. Never touches the database.' },
            { step: '2', title: 'User Encryption Key (UEK)', desc: 'Generated on user registration. Encrypted (wrapped) by the master key before DB storage. Each user has a unique 256-bit AES key.' },
            { step: '3', title: 'Data Encryption', desc: 'Transaction amounts and PII encrypted with the user\'s UEK before write. Only the authenticated session owner can trigger decryption.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-400">{step}</div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-white/40 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <CodeBlock code={`// What the DB stores (what a hacker sees):
{
  "encrypted_amount": "eyJkYXRhIjoiUjE4TnR5VE40Zz09...",  // AES ciphertext
  "encryption_key":   "eyJkYXRhIjoiZ3B6TjJKcWZ2RFE...",  // Wrapped UEK
  "email_cipher":     "W43I313m5hhEe67hi+k6N7sBKIyT..."   // Encrypted PII
}

// What your authenticated session sees:
{
  "amount": 2499.00,           // Decrypted ✅
  "email": "user@brand.com",   // Decrypted ✅
}`} />
      </DocSection>
    </>
  ),

  errors: (
    <>
      <DocSection title="Error Handling">
        <CodeBlock code={`import SecureAiPay, {
  TransactionBlockedError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NetworkError,
  WebhookVerificationError,
} from '@secureaipay/sdk';

try {
  await sdk.transactions.create({ user_token_id, amount: 50000 });
} catch (err) {
  if (err instanceof TransactionBlockedError) {
    // AI engine blocked the transaction
    console.log('Blocked:', err.reason, 'txn_id:', err.txnId);
  } else if (err instanceof AuthenticationError) {
    // Session expired — redirect to login
    redirect('/login');
  } else if (err instanceof AuthorizationError) {
    // No merchant-customer mapping
    console.log('Access denied');
  } else if (err instanceof ValidationError) {
    // Missing fields, invalid amount, etc.
    console.log('Invalid input:', err.fields);
  } else if (err instanceof NetworkError) {
    // Timeout or no connection
    console.log('Network error:', err.message);
  }
  // All errors have: err.code, err.message, err.statusCode
}`} />
        <table className="w-full text-sm mt-4">
          <thead><tr className="border-b border-white/10 text-xs text-white/40"><th className="text-left py-2 pr-6">Class</th><th className="text-left py-2 pr-6">Code</th><th className="text-left py-2">When thrown</th></tr></thead>
          <tbody>
            <PropRow name="AuthenticationError" type="AUTH_ERROR" description="Invalid or expired JWT token" />
            <PropRow name="AuthorizationError" type="AUTHORIZATION_ERROR" description="No merchant-customer mapping / insufficient role" />
            <PropRow name="TransactionBlockedError" type="TRANSACTION_BLOCKED" description="AI engine blocked the payment" />
            <PropRow name="ValidationError" type="VALIDATION_ERROR" description="Missing required fields or invalid values" />
            <PropRow name="NetworkError" type="NETWORK_ERROR" description="Server unreachable or timeout" />
            <PropRow name="WebhookVerificationError" type="WEBHOOK_VERIFICATION_ERROR" description="HMAC signature mismatch" />
          </tbody>
        </table>
      </DocSection>
    </>
  ),
};

export default function DocsPage() {
  const [active, setActive] = useState('introduction');
  const [search, setSearch] = useState('');

  const allItems = SIDEBAR.flatMap(s => s.items);
  const filtered = allItems.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));
  const currentIdx = allItems.findIndex(i => i.id === active);
  const prev = allItems[currentIdx - 1];
  const next = allItems[currentIdx + 1];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ─── Top navbar ─── */}
      <div className="fixed top-0 left-0 right-0 h-14 border-b border-white/8 bg-black/60 backdrop-blur-md z-50 flex items-center px-6 gap-4">
        <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> SecureAiPay
        </Link>
        <span className="text-white/20">|</span>
        <span className="text-sm font-semibold text-white">Developer Docs</span>
        <div className="ml-auto flex items-center gap-3">
          <a href="https://github.com/secureaipay" target="_blank" rel="noreferrer"
            className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
            GitHub <ExternalLink className="w-3 h-3" />
          </a>
          <Link to="/dashboard" className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors">
            Dashboard →
          </Link>
        </div>
      </div>

      <div className="flex pt-14">

        {/* ─── Sidebar ─── */}
        <div className="fixed left-0 top-14 bottom-0 w-64 border-r border-white/8 bg-black/30 overflow-y-auto p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search docs..."
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {(search ? [{ section: 'Results', items: filtered }] : SIDEBAR).map(({ section, items }) => (
            <div key={section} className="mb-5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2 px-2">{section}</p>
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActive(id); setSearch(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left mb-0.5 ${
                    active === id
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* ─── Main content ─── */}
        <div className="ml-64 flex-1 max-w-4xl mx-auto px-8 py-10">

          {/* Breadcrumb */}
          <p className="text-xs text-white/30 mb-6 font-mono">
            docs / {active}
          </p>

          {/* Content */}
          <div className="prose-invert">
            {CONTENT[active] || <p className="text-white/40">Documentation coming soon.</p>}
          </div>

          {/* ─── Previous / Next navigation ─── */}
          <div className="flex items-center justify-between mt-16 pt-6 border-t border-white/10">
            {prev ? (
              <button
                onClick={() => setActive(prev.id)}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Previous</p>
                  <p>{prev.label}</p>
                </span>
              </button>
            ) : <div />}

            {next && (
              <button
                onClick={() => setActive(next.id)}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group text-right"
              >
                <span>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Next</p>
                  <p>{next.label}</p>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
