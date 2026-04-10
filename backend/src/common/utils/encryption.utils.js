import crypto from 'crypto';
import env from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_MASTER_KEY, 'hex'); // 32 bytes

/**
 * Encrypt plaintext using AES-256-GCM with a per-record random IV.
 * @param {string} plaintext
 * @returns {{ ciphertext: string, iv: string, tag: string }}
 */
export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM.
 * Only callable by Identity Service internally.
 * @param {string} ciphertext
 * @param {string} ivHex
 * @param {string} tagHex
 * @returns {string} plaintext
 */
export function decrypt(ciphertext, ivHex, tagHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Create a SHA-256 hash of the input for lookup purposes.
 * @param {string} input
 * @returns {string} hex hash
 */
export function hashValue(input) {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
}

/**
 * Hash an IP address for audit logging (no raw IPs stored).
 * @param {string} ip
 * @returns {string}
 */
export function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
