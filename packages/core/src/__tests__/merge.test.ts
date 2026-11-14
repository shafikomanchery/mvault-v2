import { describe, it, expect } from 'vitest';
import { mergeLogins } from '../merge.js';
import type { Login } from '../domain/login.js';

const base = (id: string, updatedAt: string): Login => ({
  id,
  name: id,
  username: 'u',
  accountType: 'website',
  criticality: 'Medium',
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt,
  history: [],
});

describe('mergeLogins', () => {
  it('picks newer updatedAt per id', () => {
    const local = [base('a', '2024-01-02T00:00:00.000Z')];
    const remote = [base('a', '2024-01-01T00:00:00.000Z')];
    const merged = mergeLogins(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].updatedAt).toBe('2024-01-02T00:00:00.000Z');
  });
});
