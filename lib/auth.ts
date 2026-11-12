import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'sn_admin';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error('Set ADMIN_PASSWORD and SESSION_SECRET in your environment.');
  return s;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  // Compare hashes so lengths never leak
  const h = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
  return safeEqual(h(input), h(pw));
}

export function createSession(): void {
  const expires = Date.now() + MAX_AGE * 1000;
  const token = `${expires}.${sign(String(expires))}`;
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE);
}

export function isAuthed(): boolean {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  const [expires, mac] = token.split('.');
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, sign(expires));
}

// Simple in-memory login rate limit: 5 attempts per 15 minutes per IP.
const attempts = new Map<string, { count: number; reset: number }>();
export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}
export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}
