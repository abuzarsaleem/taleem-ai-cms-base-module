import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InvitationModule } from '../invitation/invitation.module.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { TenantDashboardService } from './application/tenant-dashboard.service.js';
import { TenantDashboardController } from './presentation/tenant-dashboard.controller.js';

@Module({
  imports: [TenantModule, InvitationModule, AuthModule, SubscriptionModule],
  controllers: [TenantDashboardController],
  providers: [TenantDashboardService],
})
export class DashboardModule {}
