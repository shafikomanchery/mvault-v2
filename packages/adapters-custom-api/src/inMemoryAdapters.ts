import type { AuthPort, AuthSession, AuthTokens, VaultEnvelope, VaultSyncPort } from '@mvault/ports';
import { SyncConflictError } from '@mvault/ports';

export class InMemoryAuthAdapter implements AuthPort {
  private session: AuthSession | null = null;
  private users = new Map<string, string>();

  async register(email: string, password: string): Promise<AuthSession> {
    this.users.set(email, password);
    return this.login(email, password);
  }

  async login(email: string, password: string): Promise<AuthSession> {
    if (this.users.get(email) !== password) throw new Error('Invalid credentials');
    this.session = {
      email,
      accessToken: `token-${email}`,
      refreshToken: `refresh-${email}`,
    };
    return this.session;
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return { accessToken: 'refreshed', refreshToken };
  }

  async logout(_refreshToken: string): Promise<void> {
    this.session = null;
  }

  async deleteAccount(): Promise<void> {
    this.session = null;
  }

  setSessionChangeHandler(_handler: ((session: AuthSession | null) => void) | null): void {
    /* no-op */
  }

  getAccessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  setSession(session: AuthSession | null): void {
    this.session = session;
  }
}

export class InMemoryVaultSyncAdapter implements VaultSyncPort {
  private envelope: VaultEnvelope | null = null;

  async pullVault(): Promise<VaultEnvelope | null> {
    return this.envelope;
  }

  async pushVault(ciphertext: string, expectedRevision: number): Promise<VaultEnvelope> {
    if (!this.envelope && expectedRevision !== 0) {
      throw new SyncConflictError({
        revision: 0,
        ciphertext: '',
        updatedAt: new Date().toISOString(),
      });
    }
    if (this.envelope && this.envelope.revision !== expectedRevision) {
      throw new SyncConflictError(this.envelope);
    }
    const revision = (this.envelope?.revision ?? 0) + 1;
    this.envelope = {
      revision,
      ciphertext,
      updatedAt: new Date().toISOString(),
    };
    return this.envelope;
  }
}
