import type { TenantAdminInvitationProps, TenantMemberInvitationProps } from './invitation.types.js';
import type { MembershipRole, MembershipStatus } from './membership.types.js';

export const TENANT_ADMIN_INVITATION_REPOSITORY = Symbol('TENANT_ADMIN_INVITATION_REPOSITORY');

export interface ITenantAdminInvitationRepository {
  findByTenant(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: TenantAdminInvitationProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantAdminInvitationProps | null>;
  findPendingByEmail(tenantId: string, email: string): Promise<TenantAdminInvitationProps | null>;
  findByTokenHash(tokenHash: string): Promise<TenantAdminInvitationProps | null>;
  create(props: TenantAdminInvitationProps): Promise<TenantAdminInvitationProps>;
  update(
    tenantId: string,
    id: string,
    props: Partial<TenantAdminInvitationProps>,
  ): Promise<TenantAdminInvitationProps>;
}

export const TENANT_MEMBERSHIP_REPOSITORY = Symbol('TENANT_MEMBERSHIP_REPOSITORY');

export interface TenantMembershipProps {
  id?: string;
  tenantId: string;
  userId: string;
  status?: MembershipStatus | string;
  role?: MembershipRole | string;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantMembershipDetailProps extends TenantMembershipProps {
  userEmail: string;
  userFullName: string;
  isTenantAdmin: boolean;
}

export interface UserTenantMembershipProps {
  membershipId: string;
  tenantId: string;
  tenantCode: string;
  tenantDisplayName: string;
  tenantStatus: string;
  membershipStatus: string;
  role: string;
  joinedAt: Date;
  isTenantAdmin: boolean;
}

export interface ITenantMembershipRepository {
  findByTenant(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: TenantMembershipDetailProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantMembershipDetailProps | null>;
  findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: UserTenantMembershipProps[]; total: number }>;
  findByTenantAndUser(tenantId: string, userId: string): Promise<TenantMembershipProps | null>;
  findActiveAdminByEmail(tenantId: string, email: string): Promise<TenantMembershipProps | null>;
  countActiveAdmins(tenantId: string): Promise<number>;
  upsertActive(
    tenantId: string,
    userId: string,
    role?: MembershipRole | string,
  ): Promise<TenantMembershipProps>;
  updateRole(
    tenantId: string,
    userId: string,
    role: MembershipRole | string,
  ): Promise<TenantMembershipProps>;
  updateStatus(tenantId: string, id: string, status: MembershipStatus): Promise<TenantMembershipDetailProps>;
  delete(tenantId: string, id: string): Promise<void>;
}

export const USER_IDENTITY_REPOSITORY = Symbol('USER_IDENTITY_REPOSITORY');

export interface UserIdentityProps {
  id?: string;
  userId: string;
  providerType: string;
  identifier: string;
  isPrimary?: boolean;
}

export interface IUserIdentityRepository {
  findLocalByUserId(userId: string): Promise<UserIdentityProps | null>;
  createLocal(userId: string, email: string): Promise<UserIdentityProps>;
}

export const TENANT_MEMBER_INVITATION_REPOSITORY = Symbol('TENANT_MEMBER_INVITATION_REPOSITORY');

export interface ITenantMemberInvitationRepository {
  findByTenant(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: TenantMemberInvitationProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantMemberInvitationProps | null>;
  findPendingByEmail(tenantId: string, email: string): Promise<TenantMemberInvitationProps | null>;
  findByTokenHash(tokenHash: string): Promise<TenantMemberInvitationProps | null>;
  create(props: TenantMemberInvitationProps): Promise<TenantMemberInvitationProps>;
  update(
    tenantId: string,
    id: string,
    props: Partial<TenantMemberInvitationProps>,
  ): Promise<TenantMemberInvitationProps>;
}
