import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InvitationModule } from '../invitation/invitation.module.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { PlatformDashboardService } from './application/platform-dashboard.service.js';
import { TenantDashboardService } from './application/tenant-dashboard.service.js';
import { PlatformDashboardController } from './presentation/platform-dashboard.controller.js';
import { TenantDashboardController } from './presentation/tenant-dashboard.controller.js';

@Module({
  imports: [TenantModule, InvitationModule, AuthModule, SubscriptionModule],
  controllers: [TenantDashboardController, PlatformDashboardController],
  providers: [TenantDashboardService, PlatformDashboardService],
})
export class DashboardModule {}
