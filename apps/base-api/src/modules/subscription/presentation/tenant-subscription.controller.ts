import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, PaginationQueryDto, PlatformPermission, RequirePermissions, type AuthenticatedUser } from '@app/common';
import { TenantSubscriptionService } from '../application/tenant-subscription.service.js';
import { CreateTenantSubscriptionDto } from '../application/dto/request/subscription.request.dto.js';
import {
  SubscriptionChangeResponseDto,
  SubscriptionListResponseDto,
  SubscriptionResponseDto,
} from '../application/dto/response/subscription.response.dto.js';

@ApiTags('Tenant Subscriptions')
@ApiBearerAuth()
@Controller('tenants/:tenantId/subscriptions')
export class TenantSubscriptionController {
  constructor(private readonly service: TenantSubscriptionService) {}

  @Post()
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Subscribe a tenant to a plan',
    description: 'Creates the subscription and entitles applications listed in the plan limits.',
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

  @Post(':subscriptionId/activate')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Activate a suspended subscription and restore linked entitlements' })
  @ApiOkResponse({ type: SubscriptionChangeResponseDto })
  activate(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.activate(tenantId, subscriptionId, user.userId);
  }

  @Post(':subscriptionId/suspend')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Suspend a subscription and linked entitlements' })
  @ApiOkResponse({ type: SubscriptionChangeResponseDto })
  suspend(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.suspend(tenantId, subscriptionId, user.userId);
  }

  @Post(':subscriptionId/cancel')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Cancel a subscription and revoke linked entitlements' })
  @ApiOkResponse({ type: SubscriptionChangeResponseDto })
  cancel(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancel(tenantId, subscriptionId, user.userId);
  }
}
