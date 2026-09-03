import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantAccessContext {
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  tenantId?: string;
  roles: string[];
  permissions: string[];
  tenantAccess?: TenantAccessContext;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);
