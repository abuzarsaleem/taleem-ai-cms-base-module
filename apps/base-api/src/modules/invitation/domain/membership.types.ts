export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/** Tenant-scoped membership role stored on tenant_memberships.role */
export enum MembershipRole {
  ADMIN = 'TENANT_ADMIN',
  MEMBER = 'TENANT_MEMBER',
}
