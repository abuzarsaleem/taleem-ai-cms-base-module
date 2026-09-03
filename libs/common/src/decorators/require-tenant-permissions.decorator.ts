import { SetMetadata } from '@nestjs/common';
import {
  TENANT_ID_PARAM_KEY,
  TENANT_PERMISSIONS_KEY,
  type TenantPermissionCode,
} from '../permissions.constants.js';

export interface RequireTenantPermissionsOptions {
  /** Route param name containing the tenant UUID. Defaults to `tenantId`. */
  tenantIdParam?: string;
}

export const RequireTenantPermissions = (
  ...permissions: TenantPermissionCode[]
): MethodDecorator & ClassDecorator =>
  (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    SetMetadata(TENANT_PERMISSIONS_KEY, permissions)(target, propertyKey!, descriptor!);
    SetMetadata(TENANT_ID_PARAM_KEY, 'tenantId')(target, propertyKey!, descriptor!);
  };

export const RequireTenantPermissionsWithParam = (
  tenantIdParam: string,
  ...permissions: TenantPermissionCode[]
): MethodDecorator & ClassDecorator =>
  (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    SetMetadata(TENANT_PERMISSIONS_KEY, permissions)(target, propertyKey!, descriptor!);
    SetMetadata(TENANT_ID_PARAM_KEY, tenantIdParam)(target, propertyKey!, descriptor!);
  };
