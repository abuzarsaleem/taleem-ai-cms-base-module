import type { TenantAdminInvitationProps } from './invitation.types.js';

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
  status?: string;
}

export interface ITenantMembershipRepository {
  findByTenantAndUser(tenantId: string, userId: string): Promise<TenantMembershipProps | null>;
  upsertActive(tenantId: string, userId: string): Promise<TenantMembershipProps>;
}

export const TENANT_ADMINISTRATOR_REPOSITORY = Symbol('TENANT_ADMINISTRATOR_REPOSITORY');

export interface TenantAdministratorProps {
  id?: string;
  tenantId: string;
  userId: string;
  status?: string;
  assignedBy?: string;
}

export interface ITenantAdministratorRepository {
  findActiveByTenantAndUser(tenantId: string, userId: string): Promise<TenantAdministratorProps | null>;
  findActiveByTenantAndEmail(tenantId: string, email: string): Promise<TenantAdministratorProps | null>;
  upsertActive(tenantId: string, userId: string, assignedBy: string): Promise<TenantAdministratorProps>;
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
