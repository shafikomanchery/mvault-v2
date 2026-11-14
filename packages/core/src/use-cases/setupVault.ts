import {
  createEmptyVault,
  generateRecoveryKeyPhrase,
  serializeStoredVault,
} from '@mvault/crypto';
import type { VaultSyncPort } from '@mvault/ports';

export type SetupVaultResult = {
  recoveryPhrase: string;
  serializedVault: string;
  revision: number;
};

export async function setupVault(
  masterPassword: string,
  sync: VaultSyncPort
): Promise<SetupVaultResult> {
  const recoveryPhrase = generateRecoveryKeyPhrase();
  const { stored } = await createEmptyVault(masterPassword, recoveryPhrase);
  const serialized = serializeStoredVault(stored);
  const envelope = await sync.pushVault(serialized, 0);
  return { recoveryPhrase, serializedVault: serialized, revision: envelope.revision };
}
