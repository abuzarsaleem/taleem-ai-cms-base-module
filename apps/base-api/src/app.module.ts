import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { HealthModule } from './modules/health/health.module.js';
import { TenantModule } from './modules/tenant/tenant.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { InvitationModule } from './modules/invitation/invitation.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { OauthModule } from './modules/oauth/oauth.module.js';
import { RbacModule } from './modules/rbac/rbac.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { SubscriptionModule } from './modules/subscription/subscription.module.js';
import { AccessModule } from './modules/access/access.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    HealthModule,
    TenantModule,
    IdentityModule,
    AuthModule,
    InvitationModule,
    OauthModule,
    RbacModule,
    NotificationModule,
    SubscriptionModule,
    AccessModule,
  ],
})
export class AppModule {}
