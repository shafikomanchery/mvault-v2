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
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production');

const pool = new pg.Pool({ connectionString: databaseUrl });
const users = new PgUserRepository(pool);
const vaults = new PgVaultRepository(pool);
const refreshTokens = new PgRefreshTokenRepository(pool);
const auth = new AuthService(users, refreshTokens, jwtSecret);

const app = createApp({ auth, users, vaults });

serve({ fetch: app.fetch, port }, () => {
  console.log(`mVault API listening on http://localhost:${port}`);
});
