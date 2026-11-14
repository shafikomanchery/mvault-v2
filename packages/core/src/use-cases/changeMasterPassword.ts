import {
  changeMasterPassword,
  parseStoredVault,
  reencryptLogins,
  serializeStoredVault,
  unlockVaultWithMaster,
  type LoginRecord,
} from '@mvault/crypto';

export async function changeVaultMasterPassword(
  serialized: string,
  currentMasterPassword: string,
  newMasterPassword: string,
  recoveryPhrase: string,
  logins: LoginRecord[]
): Promise<string> {
  const unlocked = await unlockVaultWithMaster(serialized, currentMasterPassword);
  const stored = parseStoredVault(serialized);
  const withNewKeyring = await changeMasterPassword(
    unlocked.vaultKey,
    stored,
    newMasterPassword,
    recoveryPhrase
  );
  const withLogins = await reencryptLogins(unlocked.vaultKey, logins, withNewKeyring);
  return serializeStoredVault(withLogins);
}