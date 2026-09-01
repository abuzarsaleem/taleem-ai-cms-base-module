import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, type PlatformRoleCode } from '../permissions.constants.js';

export const RequireRoles = (...roles: PlatformRoleCode[]) => SetMetadata(ROLES_KEY, roles);
