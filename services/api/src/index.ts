import { serve } from '@hono/node-server';
import pg from 'pg';
import { createApp } from './app.js';
import { AuthService } from './auth.js';
import {
  PgRefreshTokenRepository,
  PgUserRepository,
  PgVaultRepository,
} from './repositories/pgRepositories.js';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://mvault:mvault@localhost:5432/mvault';
const jwtSecretRaw = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production');
  }
  if (databaseUrl.includes('mvault:mvault@localhost')) {
    throw new Error('DATABASE_URL must point to a production database');
  }
}

const jwtSecret = new TextEncoder().encode(jwtSecretRaw);

const pool = new pg.Pool({ connectionString: databaseUrl });
const users = new PgUserRepository(pool);
const vaults = new PgVaultRepository(pool);
const refreshTokens = new PgRefreshTokenRepository(pool);
const auth = new AuthService(users, refreshTokens, jwtSecret);

const app = createApp({ auth, users, vaults });

serve({ fetch: app.fetch, port }, () => {
  console.log(`mVault API listening on http://localhost:${port}`);
});
