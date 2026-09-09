import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { IdentityIdentifierEntity } from '../identity/infrastructure/persistence/identity.entities.js';
import { TENANT_MEMBERSHIP_REPOSITORY } from './domain/invitation.repository.interface.js';
import { TenantMembershipEntity } from './infrastructure/persistence/invitation.entities.js';
import { TypeOrmTenantMembershipRepository } from './infrastructure/persistence/typeorm-invitation.repositories.js';
import { InvitationAcceptService } from './application/invitation-accept.service.js';
import { MembershipProvisionService } from './application/membership-provision.service.js';
import { TenantInvitationService } from './application/tenant-invitation.service.js';
import { TenantMembershipService } from './application/tenant-membership.service.js';
import { InvitationEmailService } from './application/invitation-email.service.js';
import {
  InvitationAcceptController,
  TenantAdminInvitationController,
  TenantMemberInvitationController,
} from './presentation/tenant-invitation.controller.js';
import {
  TenantMembershipController,
  UserMembershipController,
} from './presentation/tenant-membership.controller.js';
import {
  PlatformAdminInvitationController,
  PlatformMemberInvitationController,
  PlatformMembershipController,
  PlatformTenantAdminController,
} from './presentation/platform-invitation.controllers.js';

const entities = [TenantMembershipEntity, IdentityIdentifierEntity];

const repositories = [
  {
    provide: TENANT_MEMBERSHIP_REPOSITORY,
    useClass: TypeOrmTenantMembershipRepository,
  },
];

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    TenantModule,
    IdentityModule,
    NotificationModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [
    TenantAdminInvitationController,
    TenantMemberInvitationController,
    InvitationAcceptController,
    TenantMembershipController,
    UserMembershipController,
    PlatformAdminInvitationController,
    PlatformMemberInvitationController,
    PlatformMembershipController,
    PlatformTenantAdminController,
  ],
  providers: [
    InvitationAcceptService,
    MembershipProvisionService,
    TenantInvitationService,
    TenantMembershipService,
    InvitationEmailService,
    ...repositories,
  ],
  exports: [TenantInvitationService, TenantMembershipService, TENANT_MEMBERSHIP_REPOSITORY],
})
export class InvitationModule {}
