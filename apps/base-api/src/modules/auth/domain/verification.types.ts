export enum VerificationTokenType {
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

export interface VerificationTokenProps {
  id?: string;
  userId: string;
  tokenType: VerificationTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  ipAddress?: string;
  createdAt?: Date;
}
