import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { UserModule } from '../user/user.module.js';
import { UserEntity } from '../user/infrastructure/persistence/user.entity.js';
import {
  TENANT_ADMIN_INVITATION_REPOSITORY,
  TENANT_MEMBER_INVITATION_REPOSITORY,
  TENANT_MEMBERSHIP_REPOSITORY,
  USER_IDENTITY_REPOSITORY,
} from './domain/invitation.repository.interface.js';
import {
  TenantAdminInvitationEntity,
  TenantMemberInvitationEntity,
  TenantMembershipEntity,
  UserIdentityEntity,
} from './infrastructure/persistence/invitation.entities.js';
import {
  TypeOrmTenantAdminInvitationRepository,
  TypeOrmTenantMemberInvitationRepository,
  TypeOrmTenantMembershipRepository,
  TypeOrmUserIdentityRepository,
} from './infrastructure/persistence/typeorm-invitation.repositories.js';
import { InvitationAcceptService } from './application/invitation-accept.service.js';
import { TenantAdminInvitationService } from './application/tenant-admin-invitation.service.js';
import { TenantMemberInvitationService } from './application/tenant-member-invitation.service.js';
import { TenantMembershipService } from './application/tenant-membership.service.js';
import { InvitationEmailService } from './application/invitation-email.service.js';
import {
  InvitationAcceptController,
  TenantAdminInvitationController,
} from './presentation/tenant-admin-invitation.controller.js';
import { TenantMemberInvitationController } from './presentation/tenant-member-invitation.controller.js';
import {
  TenantMembershipController,
  UserMembershipController,
} from './presentation/tenant-membership.controller.js';

const entities = [
  TenantAdminInvitationEntity,
  TenantMemberInvitationEntity,
  TenantMembershipEntity,
  UserIdentityEntity,
  UserEntity,
];

const repositories = [
  {
    provide: TENANT_ADMIN_INVITATION_REPOSITORY,
    useClass: TypeOrmTenantAdminInvitationRepository,
  },
  {
    provide: TENANT_MEMBER_INVITATION_REPOSITORY,
    useClass: TypeOrmTenantMemberInvitationRepository,
  },
  {
    provide: TENANT_MEMBERSHIP_REPOSITORY,
    useClass: TypeOrmTenantMembershipRepository,
  },
  {
    provide: USER_IDENTITY_REPOSITORY,
    useClass: TypeOrmUserIdentityRepository,
  },
];

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    TenantModule,
    UserModule,
    NotificationModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [
    TenantAdminInvitationController,
    TenantMemberInvitationController,
    InvitationAcceptController,
    TenantMembershipController,
    UserMembershipController,
  ],
  providers: [
    InvitationAcceptService,
    TenantAdminInvitationService,
    TenantMemberInvitationService,
    TenantMembershipService,
    InvitationEmailService,
    ...repositories,
  ],
  exports: [
    TenantAdminInvitationService,
    TenantMemberInvitationService,
    TenantMembershipService,
    TENANT_MEMBERSHIP_REPOSITORY,
  ],
})
export class InvitationModule {}
