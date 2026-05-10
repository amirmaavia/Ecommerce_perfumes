// lib/clientCrypto.js - Client-side AES-256-GCM Encryption/Decryption using Web Crypto API
// This mirrors the server-side crypto.js but uses the browser's SubtleCrypto API

const SALT = 'luxe-parfums-salt-2024';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derive a 256-bit AES key from a password using PBKDF2
 */
async function deriveKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'luxe-parfums-default-encryption-key-2024';
  const encoder = new TextEncoder();
  
  // Import the secret as a raw key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key using PBKDF2 with same params as server
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM (client-side)
 * @param {Object|string} data - Data to encrypt
 * @returns {string} - Base64 encoded encrypted string
 */
export async function clientEncrypt(data) {
  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: TAG_LENGTH * 8 },
      key,
      encoder.encode(jsonStr)
    );

    // AES-GCM in Web Crypto appends the tag to the ciphertext
    const encryptedArray = new Uint8Array(encrypted);
    // Extract ciphertext (all but last 16 bytes) and tag (last 16 bytes)
    const ciphertext = encryptedArray.slice(0, encryptedArray.length - TAG_LENGTH);
    const tag = encryptedArray.slice(encryptedArray.length - TAG_LENGTH);

    // Combine: iv + tag + ciphertext (same format as server)
    const combined = new Uint8Array(IV_LENGTH + TAG_LENGTH + ciphertext.length);
    combined.set(iv, 0);
    combined.set(tag, IV_LENGTH);
    combined.set(ciphertext, IV_LENGTH + TAG_LENGTH);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Client encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM (client-side)
 * @param {string} encryptedData - Base64 encoded encrypted string
 * @returns {Object} - Decrypted JSON object
 */
export async function clientDecrypt(encryptedData) {
  try {
    const key = await deriveKey();
    
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract iv, tag, and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH + TAG_LENGTH);

    // AES-GCM in Web Crypto expects ciphertext + tag concatenated
    const ciphertextWithTag = new Uint8Array(ciphertext.length + TAG_LENGTH);
    ciphertextWithTag.set(ciphertext, 0);
    ciphertextWithTag.set(tag, ciphertext.length);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: TAG_LENGTH * 8 },
      key,
      ciphertextWithTag
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Client decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Create an encrypted request body
 * @param {Object} data - Data to encrypt for sending
 * @returns {Object} - { encrypted: true, payload: <encrypted_string> }
 */
export async function encryptRequestBody(data) {
  const payload = await clientEncrypt(data);
  return { encrypted: true, payload };
}

/**
 * Decrypt an encrypted response body
 * @param {Object} body - Response with { encrypted: true, payload: <string> }
 * @returns {Object} - Decrypted data
 */
export async function decryptResponseBody(body) {
  if (body && body.encrypted && body.payload) {
    return clientDecrypt(body.payload);
  }
  return body;
}

/**
 * Wrapper for fetch that handles encryption/decryption automatically
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options  
 * @returns {Object} - { ok, status, data }
 */
export async function secureFetch(url, options = {}) {
  const fetchOptions = { ...options };

  // Encrypt request body if present
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    try {
      const parsed = JSON.parse(fetchOptions.body);
      const encryptedBody = await encryptRequestBody(parsed);
      fetchOptions.body = JSON.stringify(encryptedBody);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json',
      };
    } catch {
      // If body isn't JSON, send as-is
    }
  }

  const res = await fetch(url, fetchOptions);
  const data = await res.json();

  // Decrypt response if encrypted
  const decryptedData = await decryptResponseBody(data);

  return {
    ok: res.ok,
    status: res.status,
    data: decryptedData,
  };
}
