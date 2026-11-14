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

type RequestInitExt = RequestInit & { auth?: boolean; _retried?: boolean };

export class CustomApiAuthAdapter implements AuthPort {
  private session: AuthSession | null = null;
  private sessionChangeHandler: ((session: AuthSession | null) => void) | null = null;

  constructor(private readonly config: CustomApiConfig) {}

  setSessionChangeHandler(handler: ((session: AuthSession | null) => void) | null): void {
    this.sessionChangeHandler = handler;
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  private emitSession() {
    this.sessionChangeHandler?.(this.session);
  }

  getAccessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  setSession(session: AuthSession | null): void {
    this.session = session;
    this.emitSession();
  }

  async register(email: string, password: string): Promise<AuthSession> {
    const res = await this.request<{ accessToken: string; refreshToken: string; email: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.session = { email: res.email, accessToken: res.accessToken, refreshToken: res.refreshToken };
    this.emitSession();
    return this.session;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const res = await this.request<{ accessToken: string; refreshToken: string; email: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.session = { email: res.email, accessToken: res.accessToken, refreshToken: res.refreshToken };
    this.emitSession();
    return this.session;
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      auth: false,
    });
    if (this.session) {
      this.session = { ...this.session, accessToken: res.accessToken, refreshToken: res.refreshToken };
      this.emitSession();
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
    this.emitSession();
  }

  async deleteAccount(): Promise<void> {
    await this.request('/v1/account', { method: 'DELETE' });
    this.session = null;
    this.emitSession();
  }

  async fetchAuthed(path: string, init: RequestInit, _retried = false): Promise<Response> {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
    };
    const token = this.session?.accessToken;
    if (!token) throw new AuthError('INVALID_CREDENTIALS', 'Not authenticated');
    headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${this.config.baseUrl}${path}`, { ...init, headers });
    if (res.status === 401 && this.session?.refreshToken && !_retried) {
      await this.refresh(this.session.refreshToken);
      return this.fetchAuthed(path, init, true);
    }
    if (res.status === 401) throw new AuthError('INVALID_CREDENTIALS', 'Invalid credentials');
    return res;
  }

  private async request<T>(path: string, init: RequestInitExt = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };
    if (init.auth !== false && this.session?.accessToken) {
      headers.Authorization = `Bearer ${this.session.accessToken}`;
    }
    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, { ...init, headers });
      if (
        res.status === 401 &&
        init.auth !== false &&
        this.session?.refreshToken &&
        !init._retried
      ) {
        await this.refresh(this.session.refreshToken);
        return this.request<T>(path, { ...init, _retried: true });
      }
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
    private readonly _config: CustomApiConfig,
    private readonly auth: CustomApiAuthAdapter
  ) {}

  async pullVault(): Promise<VaultEnvelope | null> {
    const res = await this.auth.fetchAuthed('/v1/vault', { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`pullVault failed: ${res.status}`);
    return (await res.json()) as VaultEnvelope;
  }

  async pushVault(ciphertext: string, expectedRevision: number): Promise<VaultEnvelope> {
    const res = await this.auth.fetchAuthed('/v1/vault', {
      method: 'PUT',
      headers: {
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