export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

/** Platform-scoped permission codes (seeded in migrations). */
export const PlatformPermission = {
  TENANT_CREATE: 'platform.tenant.create',
  TENANT_READ: 'platform.tenant.read',
  TENANT_UPDATE: 'platform.tenant.update',
  TENANT_SUSPEND: 'platform.tenant.suspend',
  USER_READ: 'platform.user.read',
  USER_MANAGE: 'platform.user.manage',
  SUBSCRIPTION_MANAGE: 'platform.subscription.manage',
  AUDIT_READ: 'platform.audit.read',
} as const;

export type PlatformPermissionCode = (typeof PlatformPermission)[keyof typeof PlatformPermission];

/** Platform-scoped role codes (seeded in migrations). */
export const PlatformRole = {
  ADMIN: 'PLATFORM_ADMIN',
  SUPPORT: 'PLATFORM_SUPPORT',
} as const;

export type PlatformRoleCode = (typeof PlatformRole)[keyof typeof PlatformRole];
