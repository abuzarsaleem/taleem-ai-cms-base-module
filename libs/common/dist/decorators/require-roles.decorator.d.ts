import { type PlatformRoleCode } from '../permissions.constants.js';
export declare const RequireRoles: (...roles: PlatformRoleCode[]) => import("@nestjs/common").CustomDecorator<string>;
