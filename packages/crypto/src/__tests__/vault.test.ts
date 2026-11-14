import { describe, it, expect } from 'vitest';
import {
  createEmptyVault,
  generateRecoveryKeyPhrase,
  reencryptLogins,
  serializeStoredVault,
  unlockVaultWithMaster,
  unlockVaultWithRecovery,
} from '../index.js';

describe('vault crypto', () => {
  it('round-trips empty vault with master password', async () => {
    const recovery = generateRecoveryKeyPhrase();
    const { vaultKey, stored } = await createEmptyVault('master-password-123', recovery);
    const serialized = serializeStoredVault(stored);
    const unlocked = await unlockVaultWithMaster(serialized, 'master-password-123');
    expect(unlocked.logins).toEqual([]);
    expect(unlocked.vaultKey).toHaveLength(32);

    const updated = await reencryptLogins(vaultKey, [
      {
        id: '1',
        name: 'Test',
        username: 'user',
        password: 'secret',
        accountType: 'website',
        criticality: 'Medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [],
      },
    ], stored);
    const serialized2 = serializeStoredVault(updated);
    const unlocked2 = await unlockVaultWithMaster(serialized2, 'master-password-123');
    expect(unlocked2.logins).toHaveLength(1);
    expect(unlocked2.logins[0].name).toBe('Test');
  });

  it('unlocks with recovery phrase', async () => {
    const recovery = generateRecoveryKeyPhrase();
    const { stored } = await createEmptyVault('master-password-123', recovery);
    const serialized = serializeStoredVault(stored);
    const unlocked = await unlockVaultWithRecovery(serialized, recovery);
    expect(unlocked.logins).toEqual([]);
  });

  it('rejects wrong master password', async () => {
    const recovery = generateRecoveryKeyPhrase();
    const { stored } = await createEmptyVault('master-password-123', recovery);
    const serialized = serializeStoredVault(stored);
    await expect(unlockVaultWithMaster(serialized, 'wrong')).rejects.toThrow('Decryption failed');
  });
});
