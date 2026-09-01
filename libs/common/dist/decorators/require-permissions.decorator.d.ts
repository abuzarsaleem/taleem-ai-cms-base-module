import { type PlatformPermissionCode } from '../permissions.constants.js';
export declare const RequirePermissions: (...permissions: PlatformPermissionCode[]) => import("@nestjs/common").CustomDecorator<string>;
