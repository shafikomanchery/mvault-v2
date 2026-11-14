import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { RefreshTokenRepository, UserRepository } from './repositories/types.js';

const ACCESS_TTL = '15m';
const REFRESH_DAYS = 30;

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwtSecret: Uint8Array
  ) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new Error('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.users.create(email, passwordHash);
    return this.issueTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('Invalid credentials');
    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    const hash = hashToken(refreshToken);
    const userId = await this.refreshTokens.consume(hash);
    if (!userId) throw new Error('Invalid refresh token');
    const user = await this.users.findById(userId);
    if (!user) throw new Error('Invalid refresh token');
    return this.issueTokens(user.id, user.email);
  }

  async logout(refreshToken: string, userId?: string) {
    if (refreshToken) {
      await this.refreshTokens.consume(hashToken(refreshToken));
    }
    if (userId) await this.refreshTokens.revokeAll(userId);
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; email: string }> {
    const { payload } = await jwtVerify(token, this.jwtSecret);
    const userId = payload.sub;
    const email = payload.email as string;
    if (!userId || !email) throw new Error('Invalid token');
    return { userId, email };
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(ACCESS_TTL)
      .sign(this.jwtSecret);

    const refreshToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
    await this.refreshTokens.store(userId, hashToken(refreshToken), expiresAt);

    return { accessToken, refreshToken, email };
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
