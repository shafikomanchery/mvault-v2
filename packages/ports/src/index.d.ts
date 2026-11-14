export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};
export type AuthSession = AuthTokens & {
    email: string;
};
export interface AuthPort {
    register(email: string, password: string): Promise<AuthSession>;
    login(email: string, password: string): Promise<AuthSession>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    logout(refreshToken: string): Promise<void>;
    getAccessToken(): string | null;
    setSession(session: AuthSession | null): void;
}
export type VaultEnvelope = {
    revision: number;
    ciphertext: string;
    updatedAt: string;
};
export declare class SyncConflictError extends Error {
    readonly code: "SYNC_CONFLICT";
    readonly serverEnvelope: VaultEnvelope;
    constructor(serverEnvelope: VaultEnvelope);
}
export declare class AuthError extends Error {
    readonly code: 'INVALID_CREDENTIALS' | 'NETWORK' | 'UNKNOWN';
    constructor(code: AuthError['code'], message: string);
}
export interface VaultSyncPort {
    pullVault(): Promise<VaultEnvelope | null>;
    pushVault(ciphertext: string, expectedRevision: number): Promise<VaultEnvelope>;
}
export interface SecureStoragePort {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    deleteItem(key: string): Promise<void>;
}
export interface ClockPort {
    now(): Date;
}
