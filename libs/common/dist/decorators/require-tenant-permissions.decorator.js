import { SetMetadata } from '@nestjs/common';
import { TENANT_ID_PARAM_KEY, TENANT_PERMISSIONS_KEY, } from '../permissions.constants.js';
export const RequireTenantPermissions = (...permissions) => (target, propertyKey, descriptor) => {
    SetMetadata(TENANT_PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
    SetMetadata(TENANT_ID_PARAM_KEY, 'tenantId')(target, propertyKey, descriptor);
};
export const RequireTenantPermissionsWithParam = (tenantIdParam, ...permissions) => (target, propertyKey, descriptor) => {
    SetMetadata(TENANT_PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
    SetMetadata(TENANT_ID_PARAM_KEY, tenantIdParam)(target, propertyKey, descriptor);
};
//# sourceMappingURL=require-tenant-permissions.decorator.js.map