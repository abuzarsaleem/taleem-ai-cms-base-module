import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, PaginationQueryDto, PlatformPermission, RequirePermissions, type AuthenticatedUser } from '@app/common';
import { TenantSubscriptionService } from '../application/tenant-subscription.service.js';
import {
  CreateTenantSubscriptionDto,
  UpdateTenantSubscriptionDto,
} from '../application/dto/request/subscription.request.dto.js';
import {
  SubscriptionListResponseDto,
  SubscriptionResponseDto,
} from '../application/dto/response/subscription.response.dto.js';

@ApiTags('Tenant Subscriptions')
@ApiBearerAuth()
@Controller('tenant/:tenantId/subscription')
export class TenantSubscriptionController {
  constructor(private readonly service: TenantSubscriptionService) {}

  @Post()
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Create a tenant subscription',
    description:
      'Records plan type, billing cycle, dates, and application codes on this subscription and entitles those applications. When the period ends this row stays inactive; continue by creating a new subscription.',
  })
  @ApiCreatedResponse({ type: SubscriptionResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user.userId);
  }

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List tenant subscriptions' })
  @ApiOkResponse({ type: SubscriptionListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() query: PaginationQueryDto) {
    return this.service.list(tenantId, query.page ?? 1, query.limit ?? 20);
  }

  @Get(':subscriptionId')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Get tenant subscription' })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  get(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
  ) {
    return this.service.get(tenantId, subscriptionId);
  }

  @Patch(':subscriptionId')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Update a tenant subscription',
    description:
      'Update dates, plan type, billing cycle, application codes, or status (ACTIVE / INACTIVE). An ended period cannot be set back to ACTIVE — create a new subscription instead.',
  })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() dto: UpdateTenantSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(tenantId, subscriptionId, dto, user.userId);
  }
}
