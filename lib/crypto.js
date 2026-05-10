// lib/crypto.js - Server-side AES-256-GCM Encryption/Decryption
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT = 'luxe-parfums-salt-2024';
const KEY_LENGTH = 32;

/**
 * Derive a 256-bit key from the secret using PBKDF2
 */
function deriveKey() {
  const secret = process.env.ENCRYPTION_KEY || 'luxe-parfums-default-encryption-key-2024';
  return crypto.pbkdf2Sync(secret, SALT, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a JSON payload using AES-256-GCM
 * @param {Object|string} data - Data to encrypt
 * @returns {string} - Base64 encoded encrypted string (iv:tag:ciphertext)
 */
export function encrypt(data) {
  try {
    const key = deriveKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    // Combine iv + tag + ciphertext as base64
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'base64')]);
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an AES-256-GCM encrypted string
 * @param {string} encryptedData - Base64 encoded encrypted string
 * @returns {Object} - Decrypted JSON object
 */
export function decrypt(encryptedData) {
  try {
    const key = deriveKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract iv, tag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Create an encrypted response object for API routes
 * @param {Object} data - The response data to encrypt
 * @returns {Object} - { encrypted: true, payload: <encrypted_string> }
 */
export function encryptResponse(data) {
  return {
    encrypted: true,
    payload: encrypt(data),
  };
}

/**
 * Decrypt an encrypted request body
 * @param {Object} body - The request body { encrypted: true, payload: <string> }
 * @returns {Object} - Decrypted data
 */
export function decryptRequest(body) {
  if (body && body.encrypted && body.payload) {
    return decrypt(body.payload);
  }
  // If not encrypted, return as-is (backward compatibility)
  return body;
}
