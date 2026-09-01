export declare const PERMISSIONS_KEY = "permissions";
export declare const ROLES_KEY = "roles";
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
export declare const PlatformRole: {
    readonly ADMIN: "PLATFORM_ADMIN";
    readonly SUPPORT: "PLATFORM_SUPPORT";
};
export type PlatformRoleCode = (typeof PlatformRole)[keyof typeof PlatformRole];
