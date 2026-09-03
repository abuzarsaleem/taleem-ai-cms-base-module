import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { UserModule } from '../user/user.module.js';
import { UserEntity } from '../user/infrastructure/persistence/user.entity.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  USER_IDENTITY_REPOSITORY,
} from './domain/invitation.repository.interface.js';
import {
  TenantMembershipEntity,
  UserIdentityEntity,
} from './infrastructure/persistence/invitation.entities.js';
import {
  TypeOrmTenantMembershipRepository,
  TypeOrmUserIdentityRepository,
} from './infrastructure/persistence/typeorm-invitation.repositories.js';
import { InvitationAcceptService } from './application/invitation-accept.service.js';
import { TenantInvitationService } from './application/tenant-invitation.service.js';
import { TenantMembershipService } from './application/tenant-membership.service.js';
import { InvitationEmailService } from './application/invitation-email.service.js';
import {
  InvitationAcceptController,
  TenantInvitationController,
} from './presentation/tenant-invitation.controller.js';
import {
  TenantMembershipController,
  UserMembershipController,
} from './presentation/tenant-membership.controller.js';

const entities = [TenantMembershipEntity, UserIdentityEntity, UserEntity];

const repositories = [
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
    TenantInvitationController,
    InvitationAcceptController,
    TenantMembershipController,
    UserMembershipController,
  ],
  providers: [
    InvitationAcceptService,
    TenantInvitationService,
    TenantMembershipService,
    InvitationEmailService,
    ...repositories,
  ],
  exports: [TenantInvitationService, TenantMembershipService, TENANT_MEMBERSHIP_REPOSITORY],
})
export class InvitationModule {}
