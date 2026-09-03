import type { MembershipRole, MembershipStatus } from './membership.types.js';

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
