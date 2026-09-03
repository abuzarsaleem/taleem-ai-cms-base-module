import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  TENANT_ID_PARAM_KEY,
  TENANT_PERMISSIONS_KEY,
  TENANT_TO_PLATFORM_PERMISSION,
  type AuthenticatedUser,
  type TenantAccessContext,
  type TenantPermissionCode,
} from '@app/common';
import { TenantAccessService } from '../../application/tenant-access.service.js';

interface TenantAuthorizedRequest {
  user?: AuthenticatedUser;
  params?: Record<string, string>;
  tenantId?: string;
  tenantAccess?: TenantAccessContext;
}

@Injectable()
export class TenantAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantAccessService: TenantAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<TenantPermissionCode[]>(
      TENANT_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions?.length) {
      return true;
    }

    const tenantIdParam =
      this.reflector.getAllAndOverride<string>(TENANT_ID_PARAM_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'tenantId';

    const request = context.switchToHttp().getRequest<TenantAuthorizedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const tenantId = request.params?.[tenantIdParam];
    if (!tenantId) {
      throw new BadRequestException(`Missing route parameter '${tenantIdParam}'`);
    }

    if (this.hasPlatformBypass(user, requiredPermissions)) {
      request.tenantId = tenantId;
      return true;
    }

    const access = await this.tenantAccessService.getAccess(user.userId, tenantId);
    if (!access) {
      throw new ForbiddenException('Not an active member of this tenant');
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      access.permissions.includes(permission),
    );
    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient tenant permissions');
    }

    const tenantAccess: TenantAccessContext = {
      tenantId: access.tenantId,
      roles: access.roles,
      permissions: access.permissions,
    };

    request.tenantId = tenantId;
    request.tenantAccess = tenantAccess;
    user.tenantAccess = tenantAccess;

    return true;
  }

  private hasPlatformBypass(
    user: AuthenticatedUser,
    requiredPermissions: TenantPermissionCode[],
  ): boolean {
    return requiredPermissions.every((permission) => {
      const platformPermission =
        TENANT_TO_PLATFORM_PERMISSION[permission as keyof typeof TENANT_TO_PLATFORM_PERMISSION];
      return platformPermission ? user.permissions.includes(platformPermission) : false;
    });
  }
}
