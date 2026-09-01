import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacService } from './application/rbac.service.js';
import {
  PermissionEntity,
  RoleEntity,
  RolePermissionEntity,
  UserRoleEntity,
} from './infrastructure/persistence/rbac.entities.js';
import { PermissionsGuard } from './infrastructure/guards/permissions.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, PermissionEntity, RolePermissionEntity, UserRoleEntity])],
  providers: [
    RbacService,
    PermissionsGuard,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [RbacService],
})
export class RbacModule {}
