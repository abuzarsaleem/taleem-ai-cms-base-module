export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';
export const TENANT_PERMISSIONS_KEY = 'tenantPermissions';
export const TENANT_ID_PARAM_KEY = 'tenantIdParam';

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

/** Tenant-scoped permission codes (derived from membership + admin flag at runtime). */
export const TenantPermission = {
  INVITE_READ: 'tenant.invite.read',
  INVITE_MANAGE: 'tenant.invite.manage',
  MEMBERS_READ: 'tenant.members.read',
  MEMBERS_MANAGE: 'tenant.members.manage',
  PROFILE_READ: 'tenant.profile.read',
  PROFILE_UPDATE: 'tenant.profile.update',
} as const;

export type TenantPermissionCode = (typeof TenantPermission)[keyof typeof TenantPermission];

/** Maps tenant permissions to platform permissions for staff bypass. */
export const TENANT_TO_PLATFORM_PERMISSION: Record<TenantPermissionCode, PlatformPermissionCode> = {
  [TenantPermission.INVITE_READ]: PlatformPermission.TENANT_READ,
  [TenantPermission.INVITE_MANAGE]: PlatformPermission.TENANT_UPDATE,
  [TenantPermission.MEMBERS_READ]: PlatformPermission.TENANT_READ,
  [TenantPermission.MEMBERS_MANAGE]: PlatformPermission.TENANT_UPDATE,
  [TenantPermission.PROFILE_READ]: PlatformPermission.TENANT_READ,
  [TenantPermission.PROFILE_UPDATE]: PlatformPermission.TENANT_UPDATE,
};

/** Platform-scoped role codes (seeded in migrations). */
export const PlatformRole = {
  ADMIN: 'PLATFORM_ADMIN',
  SUPPORT: 'PLATFORM_SUPPORT',
} as const;

export type PlatformRoleCode = (typeof PlatformRole)[keyof typeof PlatformRole];

/** Tenant-scoped role codes (derived from membership tables at runtime). */
export const TenantRole = {
  ADMIN: 'TENANT_ADMIN',
  MEMBER: 'TENANT_MEMBER',
} as const;

export type TenantRoleCode = (typeof TenantRole)[keyof typeof TenantRole];

/** Alumni application system roles (seeded for member + admin portals). */
export const AlumniRole = {
  MEMBER: 'ALUMNI_MEMBER',
  ADMIN: 'ALUMNI_ADMIN',
} as const;

export type AlumniRoleCode = (typeof AlumniRole)[keyof typeof AlumniRole];

/** Alumni application permission codes (seeded in application_permissions). */
export const AlumniPermission = {
  PORTAL_ACCESS: 'alumni.portal.access',
  PROFILE_READ: 'alumni.profile.read',
  PROFILE_UPDATE: 'alumni.profile.update',
  DIRECTORY_READ: 'alumni.directory.read',
  EVENTS_READ: 'alumni.events.read',
  NEWS_READ: 'alumni.news.read',
  ADMIN_ACCESS: 'alumni.admin.access',
  ADMIN_MEMBERS_READ: 'alumni.admin.members.read',
  ADMIN_MEMBERS_MANAGE: 'alumni.admin.members.manage',
  ADMIN_EVENTS_MANAGE: 'alumni.admin.events.manage',
  ADMIN_NEWS_MANAGE: 'alumni.admin.news.manage',
  ADMIN_REPORTS_READ: 'alumni.admin.reports.read',
  ADMIN_SETTINGS_MANAGE: 'alumni.admin.settings.manage',
} as const;

export type AlumniPermissionCode = (typeof AlumniPermission)[keyof typeof AlumniPermission];

/** Permissions granted to each tenant role (runtime derivation). */
export const TENANT_ROLE_PERMISSIONS: Record<TenantRoleCode, readonly TenantPermissionCode[]> = {
  [TenantRole.ADMIN]: Object.values(TenantPermission),
  [TenantRole.MEMBER]: [TenantPermission.PROFILE_READ],
};
