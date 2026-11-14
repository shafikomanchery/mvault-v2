import {
  changeMasterPassword,
  parseStoredVault,
  reencryptLogins,
  serializeStoredVault,
  type LoginRecord,
} from '@mvault/crypto';

/** Set a new master password when the vault was unlocked via recovery (no current master). */
export async function resetVaultMasterPassword(
  serialized: string,
  vaultKey: Uint8Array,
  newMasterPassword: string,
  recoveryPhrase: string,
  logins: LoginRecord[]
): Promise<string> {
  const stored = parseStoredVault(serialized);
  const withNewKeyring = await changeMasterPassword(vaultKey, stored, newMasterPassword, recoveryPhrase);
  const withLogins = await reencryptLogins(vaultKey, logins, withNewKeyring);
  return serializeStoredVault(withLogins);
}