import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { UserModule } from '../user/user.module.js';
import { UserEntity } from '../user/infrastructure/persistence/user.entity.js';
import {
  TENANT_ADMIN_INVITATION_REPOSITORY,
  TENANT_ADMINISTRATOR_REPOSITORY,
  TENANT_MEMBERSHIP_REPOSITORY,
  USER_IDENTITY_REPOSITORY,
} from './domain/invitation.repository.interface.js';
import {
  TenantAdminInvitationEntity,
  TenantAdministratorEntity,
  TenantMembershipEntity,
  UserIdentityEntity,
} from './infrastructure/persistence/invitation.entities.js';
import {
  TypeOrmTenantAdminInvitationRepository,
  TypeOrmTenantAdministratorRepository,
  TypeOrmTenantMembershipRepository,
  TypeOrmUserIdentityRepository,
} from './infrastructure/persistence/typeorm-invitation.repositories.js';
import { TenantAdminInvitationService } from './application/tenant-admin-invitation.service.js';
import { InvitationEmailService } from './application/invitation-email.service.js';
import {
  InvitationAcceptController,
  TenantAdminInvitationController,
} from './presentation/tenant-admin-invitation.controller.js';

const entities = [
  TenantAdminInvitationEntity,
  TenantMembershipEntity,
  TenantAdministratorEntity,
  UserIdentityEntity,
  UserEntity,
];

const repositories = [
  {
    provide: TENANT_ADMIN_INVITATION_REPOSITORY,
    useClass: TypeOrmTenantAdminInvitationRepository,
  },
  {
    provide: TENANT_MEMBERSHIP_REPOSITORY,
    useClass: TypeOrmTenantMembershipRepository,
  },
  {
    provide: TENANT_ADMINISTRATOR_REPOSITORY,
    useClass: TypeOrmTenantAdministratorRepository,
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
    AuthModule,
  ],
  controllers: [TenantAdminInvitationController, InvitationAcceptController],
  providers: [TenantAdminInvitationService, InvitationEmailService, ...repositories],
  exports: [TenantAdminInvitationService],
})
export class InvitationModule {}
