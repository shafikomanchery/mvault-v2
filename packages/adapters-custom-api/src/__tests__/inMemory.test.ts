import { describe, it, expect } from 'vitest';
import { InMemoryAuthAdapter, InMemoryVaultSyncAdapter } from '../inMemoryAdapters.js';

describe('InMemoryVaultSyncAdapter', () => {
  it('increments revision on push', async () => {
    const vault = new InMemoryVaultSyncAdapter();
    const first = await vault.pushVault('blob', 0);
    expect(first.revision).toBe(1);
    const second = await vault.pushVault('blob2', 1);
    expect(second.revision).toBe(2);
  });
});

describe('InMemoryAuthAdapter', () => {
  it('registers and logs in', async () => {
    const auth = new InMemoryAuthAdapter();
    await auth.register('u@test.com', 'pass');
    expect(auth.getAccessToken()).toBeTruthy();
  });
});
