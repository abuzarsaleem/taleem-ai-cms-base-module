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
import { PlatformTenantAdminService } from '../application/platform-tenant-admin.service.js';
import {
  PlatformInvitationQueryDto,
  PlatformMembershipQueryDto,
} from '../application/dto/request/platform-list.query.dto.js';
import {
  PlatformTenantAdminQueryDto,
  ProvisionTenantAdminDto,
} from '../application/dto/request/tenant-admin.request.dto.js';
import { TenantInvitationListResponseDto } from '../application/dto/response/invitation.response.dto.js';
import { TenantMembershipListResponseDto } from '../application/dto/response/membership.response.dto.js';
import {
  PlatformTenantAdminListResponseDto,
  ProvisionTenantAdminResponseDto,
} from '../application/dto/response/tenant-admin.response.dto.js';

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

@ApiTags('Platform Tenant Admins')
@ApiBearerAuth()
@Controller('platform/tenant-admin')
export class PlatformTenantAdminDirectoryController {
  constructor(private readonly service: PlatformTenantAdminService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({
    summary: 'List tenant administrators across institutions',
    description:
      'Users with TENANT_ADMIN membership, including tenant details and assigned application access.',
  })
  @ApiOkResponse({ type: PlatformTenantAdminListResponseDto })
  list(@Query() query: PlatformTenantAdminQueryDto) {
    return this.service.list(query);
  }
}

@ApiTags('Platform Tenant Admins')
@ApiBearerAuth()
@Controller('platform/tenant/:tenantId/admin')
export class PlatformTenantAdminController {
  constructor(private readonly service: PlatformTenantAdminService) {}

  @Post()
  @RequirePermissions(PlatformPermission.TENANT_UPDATE)
  @ApiOperation({
    summary: 'Invite or create a tenant administrator (Platform Admin)',
    description:
      'mode=INVITE sends a base invitation email and queues application access until accept. mode=CREATE provisions credentials immediately and assigns application access now.',
  })
  @ApiCreatedResponse({ type: ProvisionTenantAdminResponseDto })
  provision(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: ProvisionTenantAdminDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.provision(tenantId, dto, user.userId);
  }
}
