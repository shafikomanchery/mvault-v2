import {
  decryptLogins,
  parseStoredVault,
  reencryptLogins,
  serializeStoredVault,
  type LoginRecord,
} from '@mvault/crypto';
import type { Login } from '../domain/login.js';

export async function applyLoginSave(
  vaultKey: Uint8Array,
  serialized: string,
  login: Login
): Promise<string> {
  const stored = parseStoredVault(serialized);
  const payload = await decryptLogins(vaultKey, stored.logins);
  const record: LoginRecord = { ...login };
  const idx = payload.logins.findIndex((l: LoginRecord) => l.id === login.id);
  if (idx >= 0) payload.logins[idx] = record;
  else payload.logins.push(record);
  const updated = await reencryptLogins(vaultKey, payload.logins, stored);
  return serializeStoredVault(updated);
}

export async function applyLoginDelete(
  vaultKey: Uint8Array,
  serialized: string,
  loginId: string
): Promise<string> {
  const stored = parseStoredVault(serialized);
  const payload = await decryptLogins(vaultKey, stored.logins);
  payload.logins = payload.logins.filter((l: LoginRecord) => l.id !== loginId);
  const updated = await reencryptLogins(vaultKey, payload.logins, stored);
  return serializeStoredVault(updated);
}
