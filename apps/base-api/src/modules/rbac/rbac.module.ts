import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module.js';
import { RbacService } from './application/rbac.service.js';
import { TenantAccessService } from './application/tenant-access.service.js';
import { PlatformUserService } from './application/platform-user.service.js';
import {
  IdentityRoleEntity,
  PermissionEntity,
  RoleEntity,
  RolePermissionEntity,
} from './infrastructure/persistence/rbac.entities.js';
import {
  TenantMembershipEntity,
} from '../invitation/infrastructure/persistence/invitation.entities.js';
import { PermissionsGuard } from './infrastructure/guards/permissions.guard.js';
import { TenantAuthorizationGuard } from './infrastructure/guards/tenant-authorization.guard.js';
import { PlatformUserController } from './presentation/platform-user.controller.js';

@Module({
  imports: [
    IdentityModule,
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      IdentityRoleEntity,
      TenantMembershipEntity,
    ]),
  ],
  controllers: [PlatformUserController],
  providers: [
    RbacService,
    TenantAccessService,
    PlatformUserService,
    PermissionsGuard,
    TenantAuthorizationGuard,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantAuthorizationGuard,
    },
  ],
  exports: [RbacService, TenantAccessService],
})
export class RbacModule {}
