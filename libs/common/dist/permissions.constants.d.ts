export declare const PERMISSIONS_KEY = "permissions";
export declare const ROLES_KEY = "roles";
export declare const TENANT_PERMISSIONS_KEY = "tenantPermissions";
export declare const TENANT_ID_PARAM_KEY = "tenantIdParam";
export declare const PlatformPermission: {
    readonly TENANT_CREATE: "platform.tenant.create";
    readonly TENANT_READ: "platform.tenant.read";
    readonly TENANT_UPDATE: "platform.tenant.update";
    readonly TENANT_SUSPEND: "platform.tenant.suspend";
    readonly USER_READ: "platform.user.read";
    readonly USER_MANAGE: "platform.user.manage";
    readonly SUBSCRIPTION_MANAGE: "platform.subscription.manage";
    readonly AUDIT_READ: "platform.audit.read";
};
export type PlatformPermissionCode = (typeof PlatformPermission)[keyof typeof PlatformPermission];
export declare const TenantPermission: {
    readonly INVITE_READ: "tenant.invite.read";
    readonly INVITE_MANAGE: "tenant.invite.manage";
    readonly MEMBERS_READ: "tenant.members.read";
    readonly MEMBERS_MANAGE: "tenant.members.manage";
    readonly PROFILE_READ: "tenant.profile.read";
    readonly PROFILE_UPDATE: "tenant.profile.update";
};
export type TenantPermissionCode = (typeof TenantPermission)[keyof typeof TenantPermission];
export declare const TENANT_TO_PLATFORM_PERMISSION: Record<TenantPermissionCode, PlatformPermissionCode>;
export declare const PlatformRole: {
    readonly ADMIN: "PLATFORM_ADMIN";
    readonly SUPPORT: "PLATFORM_SUPPORT";
};
export type PlatformRoleCode = (typeof PlatformRole)[keyof typeof PlatformRole];
export declare const TenantRole: {
    readonly ADMIN: "TENANT_ADMIN";
    readonly MEMBER: "TENANT_MEMBER";
};
export type TenantRoleCode = (typeof TenantRole)[keyof typeof TenantRole];
export declare const AlumniRole: {
    readonly MEMBER: "ALUMNI_MEMBER";
    readonly ADMIN: "ALUMNI_ADMIN";
};
export type AlumniRoleCode = (typeof AlumniRole)[keyof typeof AlumniRole];
export declare const AlumniPermission: {
    readonly PORTAL_ACCESS: "alumni.portal.access";
    readonly PROFILE_READ: "alumni.profile.read";
    readonly PROFILE_UPDATE: "alumni.profile.update";
    readonly DIRECTORY_READ: "alumni.directory.read";
    readonly EVENTS_READ: "alumni.events.read";
    readonly NEWS_READ: "alumni.news.read";
    readonly ADMIN_ACCESS: "alumni.admin.access";
    readonly ADMIN_MEMBERS_READ: "alumni.admin.members.read";
    readonly ADMIN_MEMBERS_MANAGE: "alumni.admin.members.manage";
    readonly ADMIN_EVENTS_MANAGE: "alumni.admin.events.manage";
    readonly ADMIN_NEWS_MANAGE: "alumni.admin.news.manage";
    readonly ADMIN_REPORTS_READ: "alumni.admin.reports.read";
    readonly ADMIN_SETTINGS_MANAGE: "alumni.admin.settings.manage";
};
export type AlumniPermissionCode = (typeof AlumniPermission)[keyof typeof AlumniPermission];
export declare const TENANT_ROLE_PERMISSIONS: Record<TenantRoleCode, readonly TenantPermissionCode[]>;
