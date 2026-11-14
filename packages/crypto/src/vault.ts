import {
  aesDecrypt,
  aesEncrypt,
  generateVaultKey,
  unwrapVaultKeyWithMaster,
  unwrapVaultKeyWithRecovery,
  wrapVaultKeyWithMaster,
  wrapVaultKeyWithRecovery,
  type WrappedKey,
} from './aes.js';
import { recoveryPhraseToKeyMaterial } from './recovery.js';

export type LoginRecord = {
  id: string;
  name: string;
  username: string;
  password?: string;
  url?: string;
  accountType: 'website' | 'bank' | 'email' | 'subscription' | 'other';
  criticality: 'High' | 'Medium' | 'Low';
  tags?: string[];
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    timestamp: string;
    field: string;
    oldValue?: string;
    newValue: string;
  }>;
};

export type VaultKeyring = {
  vaultKeyWrappedByMaster: WrappedKey;
  vaultKeyWrappedByRecovery: WrappedKey;
};

export type LoginsPayload = {
  v: 1;
  logins: LoginRecord[];
};

/** Stored on server as JSON string (ciphertext field in sync protocol). */
export type StoredVaultBlob = {
  v: 1;
  keyring: VaultKeyring;
  logins: { iv: string; ciphertext: string };
};

export async function createEmptyVault(
  masterPassword: string,
  recoveryPhrase: string
): Promise<{ vaultKey: Uint8Array; stored: StoredVaultBlob }> {
  const vaultKey = generateVaultKey();
  const keyring: VaultKeyring = {
    vaultKeyWrappedByMaster: await wrapVaultKeyWithMaster(vaultKey, masterPassword),
    vaultKeyWrappedByRecovery: await wrapVaultKeyWithRecovery(
      vaultKey,
      recoveryPhrase,
      recoveryPhraseToKeyMaterial
    ),
  };
  const loginsPayload: LoginsPayload = { v: 1, logins: [] };
  const loginsEncrypted = await encryptLogins(vaultKey, loginsPayload);
  return {
    vaultKey,
    stored: { v: 1, keyring, logins: loginsEncrypted },
  };
}

export async function encryptLogins(
  vaultKey: Uint8Array,
  payload: LoginsPayload
): Promise<{ iv: string; ciphertext: string }> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  return aesEncrypt(vaultKey, json);
}

export function serializeStoredVault(stored: StoredVaultBlob): string {
  return JSON.stringify(stored);
}

export function parseStoredVault(serialized: string): StoredVaultBlob {
  const parsed = JSON.parse(serialized) as StoredVaultBlob;
  if (parsed.v !== 1 || !parsed.keyring || !parsed.logins) {
    throw new Error('Invalid vault blob');
  }
  return parsed;
}

export async function unlockVaultWithMaster(
  serialized: string,
  masterPassword: string
): Promise<{ vaultKey: Uint8Array; logins: LoginRecord[]; stored: StoredVaultBlob }> {
  const stored = parseStoredVault(serialized);
  try {
    const vaultKey = await unwrapVaultKeyWithMaster(
      stored.keyring.vaultKeyWrappedByMaster,
      masterPassword
    );
    const payload = await decryptLogins(vaultKey, stored.logins);
    return { vaultKey, logins: payload.logins, stored };
  } catch {
    throw new Error('Decryption failed');
  }
}

export async function unlockVaultWithRecovery(
  serialized: string,
  recoveryPhrase: string
): Promise<{ vaultKey: Uint8Array; logins: LoginRecord[]; stored: StoredVaultBlob }> {
  const stored = parseStoredVault(serialized);
  const vaultKey = await unwrapVaultKeyWithRecovery(
    stored.keyring.vaultKeyWrappedByRecovery,
    recoveryPhrase,
    recoveryPhraseToKeyMaterial
  );
  const payload = await decryptLogins(vaultKey, stored.logins);
  return { vaultKey, logins: payload.logins, stored };
}

export async function decryptLogins(
  vaultKey: Uint8Array,
  encrypted: { iv: string; ciphertext: string }
): Promise<LoginsPayload> {
  const json = await aesDecrypt(vaultKey, encrypted);
  return JSON.parse(new TextDecoder().decode(json)) as LoginsPayload;
}

export async function reencryptLogins(
  vaultKey: Uint8Array,
  logins: LoginRecord[],
  stored: StoredVaultBlob
): Promise<StoredVaultBlob> {
  const loginsEncrypted = await encryptLogins(vaultKey, { v: 1, logins });
  return { ...stored, logins: loginsEncrypted };
}

export async function changeMasterPassword(
  vaultKey: Uint8Array,
  stored: StoredVaultBlob,
  newMasterPassword: string,
  recoveryPhrase: string
): Promise<StoredVaultBlob> {
  const keyring: VaultKeyring = {
    vaultKeyWrappedByMaster: await wrapVaultKeyWithMaster(vaultKey, newMasterPassword),
    vaultKeyWrappedByRecovery: await wrapVaultKeyWithRecovery(
      vaultKey,
      recoveryPhrase,
      recoveryPhraseToKeyMaterial
    ),
  };
  return { ...stored, keyring };
}
