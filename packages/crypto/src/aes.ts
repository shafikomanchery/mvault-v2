import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base64ToBytes, bytesToBase64, randomBytes } from './encoding.js';

const PBKDF2_ITERATIONS = 310_000;

export type EncryptedBlob = {
  iv: string;
  ciphertext: string;
};

export type WrappedKey = EncryptedBlob & { salt?: string };

async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  return pbkdf2Async(sha256, passwordBytes, salt, { c: PBKDF2_ITERATIONS, dkLen: 32 });
}

export async function aesEncrypt(key: Uint8Array, plaintext: Uint8Array): Promise<EncryptedBlob> {
  if (key.length !== 32) throw new Error('Invalid AES key length');
  const iv = randomBytes(12);
  const sealed = gcm(key, iv).encrypt(plaintext);
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(sealed) };
}

export async function aesDecrypt(key: Uint8Array, blob: EncryptedBlob): Promise<Uint8Array> {
  if (key.length !== 32) throw new Error('Invalid AES key length');
  const iv = base64ToBytes(blob.iv);
  const ciphertext = base64ToBytes(blob.ciphertext);
  return gcm(key, iv).decrypt(ciphertext);
}

export async function wrapVaultKeyWithMaster(
  vaultKey: Uint8Array,
  masterPassword: string
): Promise<WrappedKey> {
  const salt = randomBytes(16);
  const key = await deriveKeyFromPassword(masterPassword, salt);
  const wrapped = await aesEncrypt(key, vaultKey);
  return { salt: bytesToBase64(salt), iv: wrapped.iv, ciphertext: wrapped.ciphertext };
}

export async function unwrapVaultKeyWithMaster(
  wrapped: WrappedKey,
  masterPassword: string
): Promise<Uint8Array> {
  if (!wrapped.salt) throw new Error('Missing salt');
  const salt = base64ToBytes(wrapped.salt);
  const key = await deriveKeyFromPassword(masterPassword, salt);
  return aesDecrypt(key, wrapped);
}

export async function wrapVaultKeyWithRecovery(
  vaultKey: Uint8Array,
  recoveryPhrase: string,
  recoveryPhraseToKeyMaterial: (p: string) => Promise<Uint8Array>
): Promise<WrappedKey> {
  const material = await recoveryPhraseToKeyMaterial(recoveryPhrase);
  const wrapped = await aesEncrypt(material, vaultKey);
  return { iv: wrapped.iv, ciphertext: wrapped.ciphertext };
}

export async function unwrapVaultKeyWithRecovery(
  wrapped: WrappedKey,
  recoveryPhrase: string,
  recoveryPhraseToKeyMaterial: (p: string) => Promise<Uint8Array>
): Promise<Uint8Array> {
  const material = await recoveryPhraseToKeyMaterial(recoveryPhrase);
  return aesDecrypt(material, wrapped);
}

export function generateVaultKey(): Uint8Array {
  return randomBytes(32);
}

export function generateStrongPassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const arr = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += charset[arr[i] % charset.length];
  return out;
}
