import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import { MembershipRole } from '../domain/membership.types.js';
import { TenantInvitationService } from '../application/tenant-invitation.service.js';
import { TenantMembershipService } from '../application/tenant-membership.service.js';
import {
  PlatformInvitationQueryDto,
  PlatformMembershipQueryDto,
} from '../application/dto/request/platform-list.query.dto.js';
import { TenantInvitationListResponseDto } from '../application/dto/response/invitation.response.dto.js';
import { TenantMembershipListResponseDto } from '../application/dto/response/membership.response.dto.js';

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
