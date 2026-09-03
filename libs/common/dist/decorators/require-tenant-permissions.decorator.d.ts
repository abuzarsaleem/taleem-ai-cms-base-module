import { type TenantPermissionCode } from '../permissions.constants.js';
export interface RequireTenantPermissionsOptions {
    tenantIdParam?: string;
}
export declare const RequireTenantPermissions: (...permissions: TenantPermissionCode[]) => MethodDecorator & ClassDecorator;
export declare const RequireTenantPermissionsWithParam: (tenantIdParam: string, ...permissions: TenantPermissionCode[]) => MethodDecorator & ClassDecorator;
