import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { AuthService } from '../auth.js';
import {
  InMemoryRefreshTokenRepository,
  InMemoryUserRepository,
  InMemoryVaultRepository,
} from '../repositories/inMemoryRepositories.js';

describe('API vault sync', () => {
  it('registers and stores vault with revision', async () => {
    const users = new InMemoryUserRepository();
    const vaults = new InMemoryVaultRepository();
    const refresh = new InMemoryRefreshTokenRepository();
    const secret = new TextEncoder().encode('test-secret');
    const auth = new AuthService(users, refresh, secret);
    const app = createApp({ auth, users, vaults });

    const reg = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@test.com', password: 'password123' }),
    });
    const { accessToken } = await reg.json();

    const put = await app.request('/v1/vault', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'If-Match': '0',
      },
      body: JSON.stringify({ ciphertext: '{"v":1}' }),
    });
    expect(put.status).toBe(200);
    const body = await put.json();
    expect(body.revision).toBe(1);
  });

  it('deletes account and vault', async () => {
    const users = new InMemoryUserRepository();
    const vaults = new InMemoryVaultRepository();
    const refresh = new InMemoryRefreshTokenRepository();
    const secret = new TextEncoder().encode('test-secret');
    const auth = new AuthService(users, refresh, secret);
    const app = createApp({ auth, users, vaults });

    const reg = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'del@test.com', password: 'password123' }),
    });
    const { accessToken } = await reg.json();

    await app.request('/v1/vault', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'If-Match': '0',
      },
      body: JSON.stringify({ ciphertext: '{}' }),
    });

    const del = await app.request('/v1/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(del.status).toBe(204);

    const vaultGet = await app.request('/v1/vault', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(vaultGet.status).toBe(401);
  });
});
