import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { HealthModule } from './modules/health/health.module.js';
import { TenantModule } from './modules/tenant/tenant.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { InvitationModule } from './modules/invitation/invitation.module.js';
import { UserModule } from './modules/user/user.module.js';
import { OauthModule } from './modules/oauth/oauth.module.js';
import { RbacModule } from './modules/rbac/rbac.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    HealthModule,
    TenantModule,
    UserModule,
    AuthModule,
    InvitationModule,
    OauthModule,
    RbacModule,
    NotificationModule,
  ],
})
export class AppModule {}
