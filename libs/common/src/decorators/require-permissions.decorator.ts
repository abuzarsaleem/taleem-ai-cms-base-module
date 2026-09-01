import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY, type PlatformPermissionCode } from '../permissions.constants.js';

export const RequirePermissions = (...permissions: PlatformPermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
