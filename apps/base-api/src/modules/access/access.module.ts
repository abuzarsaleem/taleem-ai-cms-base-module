import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationModule } from '../invitation/invitation.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RoleEntity } from '../rbac/infrastructure/persistence/rbac.entities.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { ApplicationAccessService } from './application/application-access.service.js';
import {
  ApplicationAccessAssignmentEntity,
  ApplicationPermissionEntity,
} from './infrastructure/persistence/access.entities.js';
import {
  ApplicationAccessCatalogController,
  TenantApplicationAccessController,
} from './presentation/application-access.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationPermissionEntity,
      ApplicationAccessAssignmentEntity,
      RoleEntity,
    ]),
    TenantModule,
    InvitationModule,
    SubscriptionModule,
    RbacModule,
  ],
  controllers: [TenantApplicationAccessController, ApplicationAccessCatalogController],
  providers: [ApplicationAccessService],
  exports: [ApplicationAccessService],
})
export class AccessModule {}
