export interface UserRefreshTokenProps {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt?: Date;
}
