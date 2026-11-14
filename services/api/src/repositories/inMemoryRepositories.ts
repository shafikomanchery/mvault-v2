import type { RefreshTokenRepository, UserRecord, UserRepository, VaultRecord, VaultRepository } from './types.js';
import { ConflictError } from './pgRepositories.js';
import { randomUUID } from 'crypto';

export class InMemoryUserRepository implements UserRepository {
  private users: UserRecord[] = [];

  async create(email: string, passwordHash: string): Promise<UserRecord> {
    const user: UserRecord = {
      id: randomUUID(),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.find((u) => u.email === email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async deleteById(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
  }
}

export class InMemoryVaultRepository implements VaultRepository {
  private vaults = new Map<string, VaultRecord>();

  async get(userId: string): Promise<VaultRecord | null> {
    return this.vaults.get(userId) ?? null;
  }

  async upsert(userId: string, ciphertext: string, expectedRevision: number): Promise<VaultRecord> {
    const existing = this.vaults.get(userId);
    if (!existing) {
      if (expectedRevision !== 0) throw new ConflictError(0, '');
      const record: VaultRecord = {
        userId,
        ciphertext,
        revision: 1,
        updatedAt: new Date(),
      };
      this.vaults.set(userId, record);
      return record;
    }
    if (existing.revision !== expectedRevision) {
      throw new ConflictError(existing.revision, existing.ciphertext, existing.updatedAt);
    }
    const record: VaultRecord = {
      userId,
      ciphertext,
      revision: existing.revision + 1,
      updatedAt: new Date(),
    };
    this.vaults.set(userId, record);
    return record;
  }

  async delete(userId: string): Promise<void> {
    this.vaults.delete(userId);
  }
}

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private tokens = new Map<string, { userId: string; expiresAt: Date }>();

  async store(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.tokens.set(tokenHash, { userId, expiresAt });
  }

  async consume(tokenHash: string): Promise<string | null> {
    const entry = this.tokens.get(tokenHash);
    if (!entry || entry.expiresAt < new Date()) return null;
    this.tokens.delete(tokenHash);
    return entry.userId;
  }

  async revokeAll(userId: string): Promise<void> {
    for (const [hash, entry] of this.tokens.entries()) {
      if (entry.userId === userId) this.tokens.delete(hash);
    }
  }
}
