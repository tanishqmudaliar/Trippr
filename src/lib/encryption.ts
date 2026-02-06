/**
 * Encryption Service for Cloud Backup
 *
 * Uses Web Crypto API for secure client-side encryption:
 * - PBKDF2 for key derivation (600,000 iterations per OWASP 2023)
 * - AES-256-GCM for authenticated encryption
 */

const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes for GCM

export interface EncryptedData {
  version: string;
  timestamp: string;
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64
  kdf: {
    algorithm: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
  };
  cipher: "AES-256-GCM";
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive a cryptographic key from a password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  // Import the password as a raw key
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Derive the actual encryption key
  // Create a new ArrayBuffer copy to satisfy TypeScript's strict typing
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt data with a password
 *
 * @param data - The data to encrypt (will be JSON stringified)
 * @param password - The encryption password/key
 * @returns Encrypted data object with all necessary components for decryption
 */
export async function encryptData(
  data: unknown,
  password: string,
): Promise<EncryptedData> {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive the encryption key from password
  const key = await deriveKey(password, salt);

  // Convert data to bytes
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  // Encrypt the data
  // Create a new ArrayBuffer copy to satisfy TypeScript's strict typing
  const ivBuffer = new Uint8Array(iv).buffer as ArrayBuffer;
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    key,
    plaintext,
  );

  return {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
    kdf: {
      algorithm: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
    },
    cipher: "AES-256-GCM",
  };
}

/**
 * Decrypt data with a password
 *
 * @param encryptedData - The encrypted data object
 * @param password - The decryption password/key
 * @returns The decrypted data
 * @throws Error if decryption fails (wrong password or corrupted data)
 */
export async function decryptData<T = unknown>(
  encryptedData: EncryptedData,
  password: string,
): Promise<T> {
  // Decode the base64 components
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedData.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

  // Derive the key using the same parameters
  const key = await deriveKey(password, salt);

  try {
    // Decrypt the data
    // Create a new ArrayBuffer copy to satisfy TypeScript's strict typing
    const ivBuffer = new Uint8Array(iv).buffer as ArrayBuffer;
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
      },
      key,
      ciphertext,
    );

    // Parse the decrypted JSON
    const decoded = new TextDecoder().decode(plaintext);
    return JSON.parse(decoded) as T;
  } catch {
    throw new Error(
      "Decryption failed. This usually means the password is incorrect or the data is corrupted.",
    );
  }
}
