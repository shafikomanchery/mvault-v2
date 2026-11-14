import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AuthService } from './auth.js';
import type { UserRepository, VaultRepository } from './repositories/types.js';
import { ConflictError } from './repositories/pgRepositories.js';

type Variables = {
  userId: string;
  email: string;
};

export function createApp(deps: {
  auth: AuthService;
  users: UserRepository;
  vaults: VaultRepository;
}) {
  const app = new Hono<{ Variables: Variables }>();

  app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('Permissions-Policy', 'geolocation=()');
  });

  app.post('/auth/register', async (c) => {
    const { email, password } = await c.req.json<{ email: string; password: string }>();
    try {
      const tokens = await deps.auth.register(email, password);
      return c.json(tokens);
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'Error' }, 400);
    }
  });

  app.post('/auth/login', async (c) => {
    const { email, password } = await c.req.json<{ email: string; password: string }>();
    try {
      const tokens = await deps.auth.login(email, password);
      return c.json(tokens);
    } catch {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
  });

  app.post('/auth/refresh', async (c) => {
    const { refreshToken } = await c.req.json<{ refreshToken: string }>();
    try {
      const tokens = await deps.auth.refresh(refreshToken);
      return c.json(tokens);
    } catch {
      return c.json({ error: 'Invalid refresh token' }, 401);
    }
  });

  app.post('/auth/logout', async (c) => {
    const { refreshToken } = await c.req.json<{ refreshToken: string }>();
    await deps.auth.logout(refreshToken);
    return c.body(null, 204);
  });

  app.use('/v1/*', async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) throw new HTTPException(401);
    const token = header.slice(7);
    try {
      const payload = await deps.auth.verifyAccessToken(token);
      const user = await deps.users.findById(payload.userId);
      if (!user) throw new HTTPException(401);
      c.set('userId', payload.userId);
      c.set('email', payload.email);
    } catch (e) {
      if (e instanceof HTTPException) throw e;
      throw new HTTPException(401);
    }
    await next();
  });

  app.get('/v1/vault', async (c) => {
    const userId = c.get('userId') as string;
    const vault = await deps.vaults.get(userId);
    if (!vault) return c.body(null, 404);
    return c.json({
      revision: vault.revision,
      ciphertext: vault.ciphertext,
      updatedAt: vault.updatedAt.toISOString(),
    });
  });

  app.put('/v1/vault', async (c) => {
    const userId = c.get('userId') as string;
    const ifMatch = c.req.header('If-Match');
    const expectedRevision = ifMatch ? Number(ifMatch) : 0;
    const { ciphertext } = await c.req.json<{ ciphertext: string }>();
    try {
      const vault = await deps.vaults.upsert(userId, ciphertext, expectedRevision);
      return c.json({
        revision: vault.revision,
        ciphertext: vault.ciphertext,
        updatedAt: vault.updatedAt.toISOString(),
      });
    } catch (e) {
      if (e instanceof ConflictError) {
        return c.json(
          {
            revision: e.revision,
            ciphertext: e.ciphertext,
            updatedAt: (e.updatedAt ?? new Date()).toISOString(),
          },
          409
        );
      }
      throw e;
    }
  });

  app.delete('/v1/account', async (c) => {
    const userId = c.get('userId') as string;
    await deps.vaults.delete(userId);
    await deps.auth.logout('', userId);
    await deps.users.deleteById(userId);
    return c.body(null, 204);
  });

  app.get('/health', (c) => c.json({ ok: true }));

  return app;
}
