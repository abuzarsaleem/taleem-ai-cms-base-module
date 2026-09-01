import { createHash, randomBytes } from 'node:crypto';

export function generateInvitationToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashInvitationToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
