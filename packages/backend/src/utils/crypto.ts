import crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ethers } from 'ethers';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
// Convert hex key to buffer (must be exactly 32 bytes)
const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 12; // 96-bit IV is standard for GCM

/**
 * Hash raw fingerprint template using SHA-256 with application salt
 * @param rawData Base64 string of raw template
 * @returns Hex string of the hash
 */
export function hashFingerprint(rawData: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(rawData);
  hash.update(env.FINGERPRINT_SALT);
  return hash.digest('hex');
}

/**
 * Encrypt sensitive data (AES-256-GCM)
 * @param text Plain text to encrypt
 * @returns Base64 encoded string containing IV + encrypted data + Auth Tag
 */
export function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:encrypted:authTag
  return Buffer.from(`${iv.toString('hex')}:${encrypted}:${authTag}`).toString('base64');
}

/**
 * Decrypt sensitive data
 * @param encryptedBase64 Base64 string from encryptData
 * @returns Decrypted plain text
 */
export function decryptData(encryptedBase64: string): string {
  const decoded = Buffer.from(encryptedBase64, 'base64').toString('utf8');
  const [ivHex, encryptedHex, authTagHex] = decoded.split(':');
  
  if (!ivHex || !encryptedHex || !authTagHex) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a secure random token (e.g., for refresh tokens)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS || 12);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Verify an Ethereum signature
 */
export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    return false;
  }
}

/**
 * Generate a token for EVM machine authentication
 */
export function generateMachineToken(): string {
  return generateSecureToken(64);
}
