import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'techfix_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function secret() {
  const value = process.env.TECHFIX_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error('TECHFIX_SESSION_SECRET must be configured and contain at least 32 characters.');
  }
  return value;
}

function sign(value: string) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

export function createSessionToken() {
  const payload = `${Date.now()}.${crypto.randomBytes(24).toString('hex')}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(token: string | undefined) {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [created, nonce, signature] = parts;
  const timestamp = Number(created);
  if (!Number.isFinite(timestamp)) return false;

  const expected = sign(`${created}.${nonce}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  const age = Date.now() - timestamp;
  return age >= 0 && age < SESSION_TTL_MS;
}

export async function isAdminSession() {
  const store = await cookies();
  return isValidSession(store.get(COOKIE)?.value);
}

export const adminCookieName = COOKIE;
