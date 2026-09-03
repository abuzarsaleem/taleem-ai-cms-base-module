import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { CodeChallengeMethod } from '../domain/oauth.types.js';

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const digest = createHash('sha256').update(codeVerifier).digest('base64url');
  const a = Buffer.from(digest);
  const b = Buffer.from(codeChallenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseScopeString(scope: string): string[] {
  return scope
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 900;
  const amount = Number(match[1]);
  switch (match[2]) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86400;
    default:
      return 900;
  }
}

export function assertS256Method(method: string): void {
  if (method !== CodeChallengeMethod.S256) {
    throw new Error('Only S256 code challenge method is supported');
  }
}
