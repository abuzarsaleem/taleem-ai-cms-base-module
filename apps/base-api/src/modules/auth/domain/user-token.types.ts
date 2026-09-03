export enum UserTokenType {
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  TENANT_INVITATION = 'TENANT_INVITATION',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
}

export enum UserTokenStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface UserTokenProps {
  id?: string;
  tokenType: UserTokenType;
  tokenHash: string;
  userId?: string;
  tenantId?: string;
  email?: string;
  membershipRole?: string;
  status?: UserTokenStatus | string;
  expiresAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  invitedBy?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

/** @deprecated Use UserTokenType */
export { UserTokenType as VerificationTokenType };
