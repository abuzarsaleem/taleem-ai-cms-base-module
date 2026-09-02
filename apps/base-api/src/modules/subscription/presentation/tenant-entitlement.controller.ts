import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, PaginationQueryDto, PlatformPermission, RequirePermissions, type AuthenticatedUser } from '@app/common';
import { TenantEntitlementService } from '../application/tenant-entitlement.service.js';
import {
  CreateTenantEntitlementDto,
  UpdateTenantEntitlementDto,
} from '../application/dto/request/subscription.request.dto.js';
import {
  EntitlementChangeResponseDto,
  EntitlementListResponseDto,
  EntitlementResponseDto,
} from '../application/dto/response/subscription.response.dto.js';

@ApiTags('Tenant Entitlements')
@ApiBearerAuth()
@Controller('tenants/:tenantId/entitlements')
export class TenantEntitlementController {
  constructor(private readonly service: TenantEntitlementService) {}

  @Post()
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Establish tenant application entitlement',
    description: 'Reactivates a previously suspended, expired, or removed entitlement for the same application.',
  })
  @ApiCreatedResponse({ type: EntitlementResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantEntitlementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.establish(tenantId, dto, user.userId);
  }

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List tenant entitlements' })
  @ApiOkResponse({ type: EntitlementListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() query: PaginationQueryDto) {
    return this.service.list(tenantId, query.page ?? 1, query.limit ?? 20);
  }

  @Get(':entitlementId')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Get tenant entitlement' })
  @ApiOkResponse({ type: EntitlementResponseDto })
  get(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('entitlementId', ParseUUIDPipe) entitlementId: string,
  ) {
    return this.service.get(tenantId, entitlementId);
  }

  @Patch(':entitlementId')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Change entitlement period or linked subscription' })
  @ApiOkResponse({ type: EntitlementResponseDto })
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('entitlementId', ParseUUIDPipe) entitlementId: string,
    @Body() dto: UpdateTenantEntitlementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(tenantId, entitlementId, dto, user.userId);
  }

  @Post(':entitlementId/activate')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Activate a suspended entitlement' })
  @ApiOkResponse({ type: EntitlementChangeResponseDto })
  activate(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('entitlementId', ParseUUIDPipe) entitlementId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.activate(tenantId, entitlementId, user.userId);
  }

  @Post(':entitlementId/suspend')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Suspend entitlement; application leaves availability' })
  @ApiOkResponse({ type: EntitlementChangeResponseDto })
  suspend(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('entitlementId', ParseUUIDPipe) entitlementId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.suspend(tenantId, entitlementId, user.userId);
  }

  @Post(':entitlementId/revoke')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Remove entitlement; future access is denied. Memberships are unchanged.' })
  @ApiOkResponse({ type: EntitlementChangeResponseDto })
  revoke(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('entitlementId', ParseUUIDPipe) entitlementId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.revoke(tenantId, entitlementId, user.userId);
  }
}
