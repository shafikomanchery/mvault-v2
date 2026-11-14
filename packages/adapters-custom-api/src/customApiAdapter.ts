import {
  AuthError,
  AuthPort,
  AuthSession,
  AuthTokens,
  SyncConflictError,
  VaultEnvelope,
  VaultSyncPort,
} from '@mvault/ports';

export type CustomApiConfig = {
  baseUrl: string;
};

export class CustomApiAuthAdapter implements AuthPort {
  private session: AuthSession | null = null;

  constructor(private readonly config: CustomApiConfig) {}

  getAccessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  setSession(session: AuthSession | null): void {
    this.session = session;
  }

  async register(email: string, password: string): Promise<AuthSession> {
    const res = await this.request<{ accessToken: string; refreshToken: string; email: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.session = { email: res.email, accessToken: res.accessToken, refreshToken: res.refreshToken };
    return this.session;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const res = await this.request<{ accessToken: string; refreshToken: string; email: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.session = { email: res.email, accessToken: res.accessToken, refreshToken: res.refreshToken };
    return this.session;
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (this.session) {
      this.session = { ...this.session, accessToken: res.accessToken, refreshToken: res.refreshToken };
    }
    return res;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      auth: false,
    });
    this.session = null;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { auth?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };
    if (init.auth !== false && this.session?.accessToken) {
      headers.Authorization = `Bearer ${this.session.accessToken}`;
    }
    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, { ...init, headers });
      if (res.status === 401) throw new AuthError('INVALID_CREDENTIALS', 'Invalid credentials');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof AuthError) throw e;
      throw new AuthError('NETWORK', e instanceof Error ? e.message : 'Network error');
    }
  }
}

export class CustomApiVaultSyncAdapter implements VaultSyncPort {
  constructor(
    private readonly config: CustomApiConfig,
    private readonly auth: CustomApiAuthAdapter
  ) {}

  async pullVault(): Promise<VaultEnvelope | null> {
    const token = this.auth.getAccessToken();
    if (!token) throw new AuthError('INVALID_CREDENTIALS', 'Not authenticated');
    const res = await fetch(`${this.config.baseUrl}/v1/vault`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`pullVault failed: ${res.status}`);
    return (await res.json()) as VaultEnvelope;
  }

  async pushVault(ciphertext: string, expectedRevision: number): Promise<VaultEnvelope> {
    const token = this.auth.getAccessToken();
    if (!token) throw new AuthError('INVALID_CREDENTIALS', 'Not authenticated');
    const res = await fetch(`${this.config.baseUrl}/v1/vault`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'If-Match': String(expectedRevision),
      },
      body: JSON.stringify({ ciphertext }),
    });
    if (res.status === 409) {
      const serverEnvelope = (await res.json()) as VaultEnvelope;
      throw new SyncConflictError(serverEnvelope);
    }
    if (!res.ok) throw new Error(`pushVault failed: ${res.status}`);
    return (await res.json()) as VaultEnvelope;
  }
}

export function createCustomApiAdapters(config: CustomApiConfig) {
  const auth = new CustomApiAuthAdapter(config);
  const vault = new CustomApiVaultSyncAdapter(config, auth);
  return { auth, vault };
}
