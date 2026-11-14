import { mergeLogins } from '../merge.js';
import { LoginSchema, type Login } from '../domain/login.js';
import { SyncConflictError, type VaultSyncPort } from '@mvault/ports';
import {
  parseStoredVault,
  reencryptLogins,
  serializeStoredVault,
  unlockVaultWithMaster,
} from '@mvault/crypto';

export type SyncResult = {
  serialized: string;
  logins: Login[];
  revision: number;
};

export async function pushVaultWithConflictHandling(
  vaultKey: Uint8Array,
  localSerialized: string,
  localLogins: Login[],
  expectedRevision: number,
  masterPassword: string,
  sync: VaultSyncPort
): Promise<SyncResult> {
  try {
    const envelope = await sync.pushVault(localSerialized, expectedRevision);
    return {
      serialized: envelope.ciphertext,
      logins: localLogins,
      revision: envelope.revision,
    };
  } catch (err: unknown) {
    if (!(err instanceof SyncConflictError)) throw err;
    const serverSerialized = err.serverEnvelope.ciphertext;
    const localStored = parseStoredVault(localSerialized);
    const serverUnlocked = await unlockVaultWithMaster(serverSerialized, masterPassword);
    const serverLogins = serverUnlocked.logins.map((l) => LoginSchema.parse(l));
    const merged = mergeLogins(localLogins, serverLogins);
    const mergedStored = await reencryptLogins(vaultKey, merged, localStored);
    const mergedSerialized = serializeStoredVault(mergedStored);
    const envelope = await sync.pushVault(mergedSerialized, err.serverEnvelope.revision);
    return {
      serialized: envelope.ciphertext,
      logins: merged,
      revision: envelope.revision,
    };
  }
}
