import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import { TenantSubscriptionService } from '../application/tenant-subscription.service.js';
import { TenantEntitlementService } from '../application/tenant-entitlement.service.js';
import { SubscriptionLifecycleService } from '../application/subscription-lifecycle.service.js';
import {
  PlatformEntitlementQueryDto,
  PlatformSubscriptionQueryDto,
} from '../application/dto/request/platform-list.query.dto.js';
import {
  EntitlementListResponseDto,
  SubscriptionListResponseDto,
} from '../application/dto/response/subscription.response.dto.js';

class SubscriptionLifecycleRunResponseDto {
  @ApiProperty() warningsSent!: number;
  @ApiProperty() expired!: number;
  @ApiProperty() skipped!: number;
  @ApiProperty({ type: [String] }) errors!: string[];
}

@ApiTags('Tenant Subscriptions')
@ApiBearerAuth()
@Controller('platform/subscription')
export class PlatformSubscriptionController {
  constructor(
    private readonly service: TenantSubscriptionService,
    private readonly lifecycle: SubscriptionLifecycleService,
  ) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List subscriptions across all tenants (platform admin)' })
  @ApiOkResponse({ type: SubscriptionListResponseDto })
  listAll(@Query() query: PlatformSubscriptionQueryDto) {
    const { page, limit, ...filters } = query;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }

  @Post('lifecycle/run')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Run subscription lifecycle job now',
    description:
      'Sends expiry warning emails for configured day thresholds and marks ended ACTIVE subscriptions as INACTIVE (with entitlement cascade + audit).',
  })
  @ApiOkResponse({ type: SubscriptionLifecycleRunResponseDto })
  runLifecycle() {
    return this.lifecycle.runDaily();
  }
}

@ApiTags('Tenant Entitlements')
@ApiBearerAuth()
@Controller('platform/entitlement')
export class PlatformEntitlementController {
  constructor(private readonly service: TenantEntitlementService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List entitlements across all tenants (platform admin)' })
  @ApiOkResponse({ type: EntitlementListResponseDto })
  listAll(@Query() query: PlatformEntitlementQueryDto) {
    const { page, limit, ...filters } = query;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}
