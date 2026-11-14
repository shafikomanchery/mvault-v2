import type { AuthPort, VaultSyncPort } from '@mvault/ports';

/**
 * Placeholder factory. Replace with Supabase Auth + Storage implementation per ADR.
 */
export function createSupabaseAdapters(_config: {
  url: string;
  anonKey: string;
}): { auth: AuthPort; vault: VaultSyncPort } {
  throw new Error('@mvault/adapter-supabase is not implemented yet. Use custom API adapter.');
}
