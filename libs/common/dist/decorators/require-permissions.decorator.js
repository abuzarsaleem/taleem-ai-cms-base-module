import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../permissions.constants.js';
export const RequirePermissions = (...permissions) => SetMetadata(PERMISSIONS_KEY, permissions);
//# sourceMappingURL=require-permissions.decorator.js.map