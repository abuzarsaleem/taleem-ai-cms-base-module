import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ApiKeyGuard } from '../auth/infrastructure/guards/api-key.guard.js';
import { NotificationModule } from '../notification/notification.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { IdentityIdentifierEntity } from '../identity/infrastructure/persistence/identity.entities.js';
import { RoleEntity } from '../rbac/infrastructure/persistence/rbac.entities.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { TENANT_MEMBERSHIP_REPOSITORY } from './domain/invitation.repository.interface.js';
import { TenantMembershipEntity } from './infrastructure/persistence/invitation.entities.js';
import { TypeOrmTenantMembershipRepository } from './infrastructure/persistence/typeorm-invitation.repositories.js';
import { AlumniMemberOnboardService } from './application/alumni-member-onboard.service.js';
import { ApplicantMemberOnboardService } from './application/applicant-member-onboard.service.js';
import { InvitationAcceptService } from './application/invitation-accept.service.js';
import { MembershipProvisionService } from './application/membership-provision.service.js';
import { PlatformTenantAdminService } from './application/platform-tenant-admin.service.js';
import { TenantInvitationService } from './application/tenant-invitation.service.js';
import { TenantMembershipService } from './application/tenant-membership.service.js';
import { InvitationEmailService } from './application/invitation-email.service.js';
import { AlumniMemberOnboardController } from './presentation/alumni-member-onboard.controller.js';
import { ApplicantMemberOnboardController } from './presentation/applicant-member-onboard.controller.js';
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
  PlatformTenantAdminDirectoryController,
} from './presentation/platform-invitation.controllers.js';

const entities = [TenantMembershipEntity, IdentityIdentifierEntity, RoleEntity];

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
    SubscriptionModule,
    forwardRef(() => AuthModule),
    forwardRef(() => AccessModule),
  ],
  controllers: [
    AlumniMemberOnboardController,
    ApplicantMemberOnboardController,
    TenantAdminInvitationController,
    TenantMemberInvitationController,
    InvitationAcceptController,
    TenantMembershipController,
    UserMembershipController,
    PlatformAdminInvitationController,
    PlatformMemberInvitationController,
    PlatformMembershipController,
    PlatformTenantAdminDirectoryController,
    PlatformTenantAdminController,
  ],
  providers: [
    AlumniMemberOnboardService,
    ApplicantMemberOnboardService,
    InvitationAcceptService,
    MembershipProvisionService,
    TenantInvitationService,
    TenantMembershipService,
    PlatformTenantAdminService,
    InvitationEmailService,
    ApiKeyGuard,
    ...repositories,
  ],
  exports: [TenantInvitationService, TenantMembershipService, TENANT_MEMBERSHIP_REPOSITORY],
})
export class InvitationModule {}
