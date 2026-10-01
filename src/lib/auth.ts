import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

export const SESSION_COOKIE = 'ss_session';
const SESSION_TTL_MS = 12 * 3600 * 1000;

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function scryptHash(code: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(code, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt:16384:8:1:${salt}:${hash}`;
}

export function scryptVerify(code: string, stored: string) {
  const parts = stored.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, salt, hash] = parts;
  const computed = crypto.scryptSync(code, salt, 64, { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), computed);
}

export function codeLookupHash(code: string) {
  return crypto
    .createHmac('sha256', process.env.AUTH_SECRET ?? 'dev-secret')
    .update(code.toUpperCase().trim())
    .digest('hex');
}

export async function createSession(userId: string, role: 'STUDENT' | 'TRAINER') {
  const token = crypto.randomBytes(32).toString('base64url');
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      role,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return db.session.findFirst({
    where: { tokenHash: sha256(token), expiresAt: { gt: new Date() } },
    include: { user: true },
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  store.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
}
