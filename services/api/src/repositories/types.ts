export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface VaultRecord {
  userId: string;
  ciphertext: string;
  revision: number;
  updatedAt: Date;
}

export interface UserRepository {
  create(email: string, passwordHash: string): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  deleteById(id: string): Promise<void>;
}

export interface VaultRepository {
  get(userId: string): Promise<VaultRecord | null>;
  upsert(userId: string, ciphertext: string, expectedRevision: number): Promise<VaultRecord>;
  delete(userId: string): Promise<void>;
}

export interface RefreshTokenRepository {
  store(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  consume(tokenHash: string): Promise<string | null>;
  revokeAll(userId: string): Promise<void>;
}
