import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import type { Role } from '@jobster/shared';
import { HttpError } from './http';
import type { Store, StoredUser } from './store';

export type AppEnv = { Variables: { user: StoredUser; token: string } };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

export function createSession(store: Store, userId: string): string {
  const token = randomBytes(32).toString('hex');
  store.data.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  store.save();
  return token;
}

export function publicUser({ passwordHash: _, ...user }: StoredUser) {
  return user;
}

/** Resolve the bearer token to a user and make it available as c.get('user'). */
export function requireAuth(store: Store): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const token = c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const session = token ? store.data.sessions.find((s) => s.token === token) : undefined;
    const user = session ? store.user(session.userId) : undefined;
    if (!user || !token) throw new HttpError(401, 'Please sign in');
    c.set('user', user);
    c.set('token', token);
    await next();
  };
}

export function currentUser(c: Context<AppEnv>, role?: Role): StoredUser {
  const user = c.get('user');
  if (role && user.role !== role) throw new HttpError(403, `Only ${role}s can do that`);
  return user;
}
