import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    // 96-bit IV (GCM standard)
const KEY_LENGTH = 32;   // 256-bit key

// ─── Utility: Validate key length ───
function validateKey(key) {
  if (!Buffer.isBuffer(key) || key.length !== KEY_LENGTH) {
    throw new Error('Encryption key must be a 32-byte Buffer');
  }
}

/**
 * Encrypt plaintext with a given key.
 * Returns a compact base64 JSON string in format: { data, iv, tag }
 *
 * @param {string|number} plaintext
 * @param {Buffer} key - 32-byte Buffer
 * @returns {string} base64-encoded JSON string
 */
export function encrypt(plaintext, key) {
  validateKey(key);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const input = String(plaintext);
  let ciphertext = cipher.update(input, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const tag = cipher.getAuthTag();

  const payload = JSON.stringify({
    data: ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  });

  return Buffer.from(payload).toString('base64');
}

/**
 * Decrypt an encrypted string produced by encrypt().
 *
 * @param {string} encryptedStr - base64-encoded JSON string
 * @param {Buffer} key - 32-byte Buffer
 * @returns {string} original plaintext
 */
export function decrypt(encryptedStr, key) {
  validateKey(key);

  try {
    const payload = JSON.parse(Buffer.from(encryptedStr, 'base64').toString('utf8'));
    const { data, iv, tag } = payload;

    if (!data || !iv || !tag) {
      throw new Error('Malformed encrypted payload: missing fields');
    }

    const ivBuf = Buffer.from(iv, 'base64');
    const tagBuf = Buffer.from(tag, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
    decipher.setAuthTag(tagBuf);

    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    if (err.message.includes('Unsupported state') || err.code === 'ERR_CRYPTO_GCM_AUTH_TAG_MISMATCH') {
      throw new Error('DECRYPTION_FAILED: AuthTag mismatch — data may be tampered');
    }
    throw new Error(`DECRYPTION_FAILED: ${err.message}`);
  }
}

/**
 * Generate a cryptographically secure 32-byte (256-bit) random key.
 * @returns {Buffer}
 */
export function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Encrypt a key Buffer using the master key (hex string from env).
 * Used to wrap User Encryption Keys (UEKs) before DB storage.
 *
 * @param {Buffer} keyToWrap - raw 32-byte key
 * @param {string} masterKeyHex - 64-char hex string (32 bytes)
 * @returns {string} base64-encoded encrypted key string
 */
export function wrapKey(keyToWrap, masterKeyHex) {
  const masterKey = Buffer.from(masterKeyHex, 'hex');
  if (masterKey.length !== KEY_LENGTH) {
    throw new Error('Master key must be 32 bytes (64 hex chars)');
  }
  return encrypt(keyToWrap.toString('hex'), masterKey);
}

/**
 * Decrypt a wrapped (encrypted) key back to a raw Buffer.
 *
 * @param {string} wrappedKey - base64-encoded encrypted key
 * @param {string} masterKeyHex - 64-char hex string
 * @returns {Buffer} raw 32-byte key Buffer
 */
export function unwrapKey(wrappedKey, masterKeyHex) {
  const masterKey = Buffer.from(masterKeyHex, 'hex');
  if (masterKey.length !== KEY_LENGTH) {
    throw new Error('Master key must be 32 bytes (64 hex chars)');
  }
  const hexKey = decrypt(wrappedKey, masterKey);
  return Buffer.from(hexKey, 'hex');
}

/**
 * Create a SHA-256 hash for lookup purposes (emails, phones).
 * @param {string} input
 * @returns {string} hex string
 */
export function hashValue(input) {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
}

/**
 * Hash an IP address for anonymous audit logging.
 * @param {string} ip
 * @returns {string}
 */
export function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
