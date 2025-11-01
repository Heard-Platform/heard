/**
 * Password hashing and validation utilities using Web Crypto API
 */

const SALT_LENGTH = 16;
const HASH_ITERATIONS = 100000;

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hash a password with a salt using PBKDF2
 */
async function hashPasswordWithSalt(
  password: string,
  salt: Uint8Array,
): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: HASH_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return bufferToHex(hashBuffer);
}

/**
 * Hash a password and return salt:hash format
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const hash = await hashPasswordWithSalt(password, salt);
  const saltHex = bufferToHex(salt);
  return `${saltHex}:${hash}`;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const [saltHex, hash] = storedHash.split(":");
    if (!saltHex || !hash) {
      return false;
    }

    const salt = hexToBuffer(saltHex);
    const computedHash = await hashPasswordWithSalt(password, salt);

    return computedHash === hash;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Generate a random password for existing users
 */
export function generateRandomPassword(length = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

/**
 * Generate a secure reset token
 */
export function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}
