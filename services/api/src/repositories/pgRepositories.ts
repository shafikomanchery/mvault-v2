import pg from 'pg';
import type { RefreshTokenRepository, UserRecord, UserRepository, VaultRecord, VaultRepository } from './types.js';

export class PgUserRepository implements UserRepository {
  constructor(private readonly pool: pg.Pool) {}

  async create(email: string, passwordHash: string): Promise<UserRecord> {
    const res = await this.pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash, created_at`,
      [email.toLowerCase(), passwordHash]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const res = await this.pool.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<UserRecord | null> {
    const res = await this.pool.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE id = $1`,
      [id]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  }
}

export class PgVaultRepository implements VaultRepository {
  constructor(private readonly pool: pg.Pool) {}

  async get(userId: string): Promise<VaultRecord | null> {
    const res = await this.pool.query(
      `SELECT user_id, ciphertext, revision, updated_at FROM vaults WHERE user_id = $1`,
      [userId]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      userId: row.user_id,
      ciphertext: row.ciphertext,
      revision: Number(row.revision),
      updatedAt: row.updated_at,
    };
  }

  async upsert(userId: string, ciphertext: string, expectedRevision: number): Promise<VaultRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query(
        `SELECT revision, ciphertext, updated_at FROM vaults WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );
      if (!existing.rows[0]) {
        if (expectedRevision !== 0) {
          await client.query('ROLLBACK');
          throw new ConflictError(0, '');
        }
        const ins = await client.query(
          `INSERT INTO vaults (user_id, ciphertext, revision) VALUES ($1, $2, 1) RETURNING user_id, ciphertext, revision, updated_at`,
          [userId, ciphertext]
        );
        await client.query('COMMIT');
        const row = ins.rows[0];
        return {
          userId: row.user_id,
          ciphertext: row.ciphertext,
          revision: Number(row.revision),
          updatedAt: row.updated_at,
        };
      }
      const currentRev = Number(existing.rows[0].revision);
      if (currentRev !== expectedRevision) {
        await client.query('ROLLBACK');
        throw new ConflictError(currentRev, existing.rows[0].ciphertext, existing.rows[0].updated_at);
      }
      const upd = await client.query(
        `UPDATE vaults SET ciphertext = $2, revision = revision + 1, updated_at = NOW() WHERE user_id = $1 RETURNING user_id, ciphertext, revision, updated_at`,
        [userId, ciphertext]
      );
      await client.query('COMMIT');
      const row = upd.rows[0];
      return {
        userId: row.user_id,
        ciphertext: row.ciphertext,
        revision: Number(row.revision),
        updatedAt: row.updated_at,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async delete(userId: string): Promise<void> {
    await this.pool.query(`DELETE FROM vaults WHERE user_id = $1`, [userId]);
  }
}

export class ConflictError extends Error {
  readonly revision: number;
  readonly ciphertext: string;
  readonly updatedAt?: Date;

  constructor(revision: number, ciphertext: string, updatedAt?: Date) {
    super('Conflict');
    this.revision = revision;
    this.ciphertext = ciphertext;
    this.updatedAt = updatedAt;
  }
}

export class PgRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly pool: pg.Pool) {}

  async store(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async consume(tokenHash: string): Promise<string | null> {
    const res = await this.pool.query(
      `DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() RETURNING user_id`,
      [tokenHash]
    );
    return res.rows[0]?.user_id ?? null;
  }

  async revokeAll(userId: string): Promise<void> {
    await this.pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
  }
}
