import { unlockVaultWithRecovery } from '@mvault/crypto';
import type { VaultSyncPort } from '@mvault/ports';

export async function unlockVaultFromRecovery(
  recoveryPhrase: string,
  sync: VaultSyncPort
) {
  const envelope = await sync.pullVault();
  if (!envelope) throw new Error('No vault found');
  const unlocked = await unlockVaultWithRecovery(envelope.ciphertext, recoveryPhrase);
  return {
    vaultKey: unlocked.vaultKey,
    logins: unlocked.logins,
    serialized: envelope.ciphertext,
    revision: envelope.revision,
  };
}