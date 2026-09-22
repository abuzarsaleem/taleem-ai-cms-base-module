import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationModule } from '../invitation/invitation.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import {
  RoleEntity,
  RolePermissionEntity,
} from '../rbac/infrastructure/persistence/rbac.entities.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { ApplicationAccessService } from './application/application-access.service.js';
import { ApplicationRegistrationService } from './application/application-registration.service.js';
import { ApplicationRoleService } from './application/application-role.service.js';
import {
  ApplicationAccessAssignmentEntity,
  ApplicationPermissionEntity,
} from './infrastructure/persistence/access.entities.js';
import {
  ApplicationAccessCatalogController,
  MyApplicationsController,
  TenantApplicationAccessController,
  TenantMembershipApplicationController,
} from './presentation/application-access.controller.js';
import { ApplicationRegistrationController } from './presentation/application-registration.controller.js';
import { PlatformApplicationRoleController } from './presentation/platform-application-role.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationPermissionEntity,
      ApplicationAccessAssignmentEntity,
      RoleEntity,
      RolePermissionEntity,
    ]),
    TenantModule,
    forwardRef(() => InvitationModule),
    forwardRef(() => SubscriptionModule),
    RbacModule,
  ],
  controllers: [
    ApplicationRegistrationController,
    PlatformApplicationRoleController,
    TenantMembershipApplicationController,
    TenantApplicationAccessController,
    ApplicationAccessCatalogController,
    MyApplicationsController,
  ],
  providers: [ApplicationAccessService, ApplicationRoleService, ApplicationRegistrationService],
  exports: [ApplicationAccessService, ApplicationRoleService],
})
export class AccessModule {}
