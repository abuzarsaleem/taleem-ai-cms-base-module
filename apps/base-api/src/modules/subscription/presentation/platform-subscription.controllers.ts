import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import { TenantSubscriptionService } from '../application/tenant-subscription.service.js';
import { TenantEntitlementService } from '../application/tenant-entitlement.service.js';
import {
  PlatformEntitlementQueryDto,
  PlatformSubscriptionQueryDto,
} from '../application/dto/request/platform-list.query.dto.js';
import {
  EntitlementListResponseDto,
  SubscriptionListResponseDto,
} from '../application/dto/response/subscription.response.dto.js';

@ApiTags('Tenant Subscriptions')
@ApiBearerAuth()
@Controller('platform/subscription')
export class PlatformSubscriptionController {
  constructor(private readonly service: TenantSubscriptionService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List subscriptions across all tenants (platform admin)' })
  @ApiOkResponse({ type: SubscriptionListResponseDto })
  listAll(@Query() query: PlatformSubscriptionQueryDto) {
    const { page, limit, ...filters } = query;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
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
