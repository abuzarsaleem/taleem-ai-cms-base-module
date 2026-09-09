import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  PlatformPermission,
  RequirePermissions,
  type AuthenticatedUser,
} from '@app/common';
import { MembershipRole } from '../domain/membership.types.js';
import { TenantInvitationService } from '../application/tenant-invitation.service.js';
import { TenantMembershipService } from '../application/tenant-membership.service.js';
import {
  PlatformInvitationQueryDto,
  PlatformMembershipQueryDto,
} from '../application/dto/request/platform-list.query.dto.js';
import { CreateTenantMembershipDto } from '../application/dto/request/membership.request.dto.js';
import { TenantInvitationListResponseDto } from '../application/dto/response/invitation.response.dto.js';
import {
  TenantMembershipListResponseDto,
  TenantMembershipResponseDto,
} from '../application/dto/response/membership.response.dto.js';

@ApiTags('Tenant Admin Invitations')
@ApiBearerAuth()
@Controller('platform/admin-invitation')
export class PlatformAdminInvitationController {
  constructor(private readonly service: TenantInvitationService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List admin invitations across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantInvitationListResponseDto })
  listAll(@Query() q: PlatformInvitationQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, MembershipRole.ADMIN, filters);
  }
}

@ApiTags('Tenant Member Invitations')
@ApiBearerAuth()
@Controller('platform/member-invitation')
export class PlatformMemberInvitationController {
  constructor(private readonly service: TenantInvitationService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List member invitations across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantInvitationListResponseDto })
  listAll(@Query() q: PlatformInvitationQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, MembershipRole.MEMBER, filters);
  }
}

@ApiTags('Tenant Memberships')
@ApiBearerAuth()
@Controller('platform/membership')
export class PlatformMembershipController {
  constructor(private readonly service: TenantMembershipService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List memberships across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantMembershipListResponseDto })
  listAll(@Query() q: PlatformMembershipQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}

@ApiTags('Tenant Memberships')
@ApiBearerAuth()
@Controller('platform/tenant/:tenantId/admin')
export class PlatformTenantAdminController {
  constructor(private readonly service: TenantMembershipService) {}

  @Post()
  @RequirePermissions(PlatformPermission.TENANT_UPDATE)
  @ApiOperation({
    summary: 'Create a tenant administrator with credentials (Platform Admin)',
    description:
      'Directly provisions the identity and ACTIVE TENANT_ADMIN membership. Invitation APIs remain available as an alternative.',
  })
  @ApiCreatedResponse({ type: TenantMembershipResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createDirect(tenantId, dto, MembershipRole.ADMIN, user.userId);
  }
}
