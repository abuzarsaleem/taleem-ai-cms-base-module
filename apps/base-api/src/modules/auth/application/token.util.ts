import { createHash, randomBytes } from 'node:crypto';

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** @deprecated Use generateToken */
export const generateVerificationToken = generateToken;

/** @deprecated Use hashToken */
export const hashVerificationToken = hashToken;
