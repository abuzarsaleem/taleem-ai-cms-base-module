import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  PaginationQueryDto,
  RequireTenantPermissions,
  TenantPermission,
  type AuthenticatedUser,
} from '@app/common';
import { TenantMembershipService } from '../application/tenant-membership.service.js';
import { UpdateTenantMembershipDto } from '../application/dto/request/membership.request.dto.js';
import {
  TenantMembershipListResponseDto,
  TenantMembershipResponseDto,
  UserTenantMembershipListResponseDto,
} from '../application/dto/response/membership.response.dto.js';

@ApiTags('Tenant Memberships')
@ApiBearerAuth()
@Controller('tenant/:tenantId/membership')
export class TenantMembershipController {
  constructor(private readonly service: TenantMembershipService) {}

  @Get()
  @RequireTenantPermissions(TenantPermission.MEMBERS_READ)
  @ApiOperation({ summary: 'List tenant memberships' })
  @ApiOkResponse({ type: TenantMembershipListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.listForTenant(tenantId, q.page ?? 1, q.limit ?? 20);
  }

  @Get(':id')
  @RequireTenantPermissions(TenantPermission.MEMBERS_READ)
  @ApiOperation({ summary: 'Get tenant membership' })
  @ApiOkResponse({ type: TenantMembershipResponseDto })
  get(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getForTenant(tenantId, id);
  }

  @Patch(':id')
  @RequireTenantPermissions(TenantPermission.MEMBERS_MANAGE)
  @ApiOperation({ summary: 'Update membership status and/or tenant admin role' })
  @ApiOkResponse({ type: TenantMembershipResponseDto })
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(tenantId, id, dto, user.userId);
  }

  @Delete(':id')
  @RequireTenantPermissions(TenantPermission.MEMBERS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove user from tenant (revokes admin role if applicable)' })
  @ApiNoContentResponse()
  remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(tenantId, id, user.userId);
  }
}

@ApiTags('User Memberships')
@ApiBearerAuth()
@Controller('user/me/tenant-membership')
export class UserMembershipController {
  constructor(private readonly service: TenantMembershipService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants the current user belongs to' })
  @ApiOkResponse({ type: UserTenantMembershipListResponseDto })
  list(@CurrentUser() user: AuthenticatedUser, @Query() q: PaginationQueryDto) {
    return this.service.listForCurrentUser(user.userId, q.page ?? 1, q.limit ?? 20);
  }
}
