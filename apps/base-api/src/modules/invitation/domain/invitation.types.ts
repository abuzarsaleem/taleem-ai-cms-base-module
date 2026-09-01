export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface TenantAdminInvitationProps {
  id?: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  invitedBy: string;
  createdAt?: Date;
}
