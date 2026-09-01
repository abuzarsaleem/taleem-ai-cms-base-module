import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../permissions.constants.js';
export const RequireRoles = (...roles) => SetMetadata(ROLES_KEY, roles);
//# sourceMappingURL=require-roles.decorator.js.map