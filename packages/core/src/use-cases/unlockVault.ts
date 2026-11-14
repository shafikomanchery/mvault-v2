import { unlockVaultWithMaster, type LoginRecord } from '@mvault/crypto';
import type { VaultSyncPort } from '@mvault/ports';

export type UnlockedVault = {
  vaultKey: Uint8Array;
  logins: LoginRecord[];
  serialized: string;
  revision: number;
};

export async function unlockVault(
  masterPassword: string,
  sync: VaultSyncPort
): Promise<UnlockedVault> {
  const envelope = await sync.pullVault();
  if (!envelope) throw new Error('No vault found');
  const { vaultKey, logins } = await unlockVaultWithMaster(envelope.ciphertext, masterPassword);
  return {
    vaultKey,
    logins,
    serialized: envelope.ciphertext,
    revision: envelope.revision,
  };
}
