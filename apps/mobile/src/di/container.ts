import { createCustomApiAdapters } from '@mvault/adapter-custom-api';
import type { AuthPort, VaultSyncPort } from '@mvault/ports';
import Constants from 'expo-constants';

const apiUrl =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';

let authPort: AuthPort | null = null;
let vaultSyncPort: VaultSyncPort | null = null;

export function getAdapters(): { auth: AuthPort; vault: VaultSyncPort } {
  if (!authPort || !vaultSyncPort) {
    const adapters = createCustomApiAdapters({ baseUrl: apiUrl });
    authPort = adapters.auth;
    vaultSyncPort = adapters.vault;
  }
  return { auth: authPort, vault: vaultSyncPort };
}
