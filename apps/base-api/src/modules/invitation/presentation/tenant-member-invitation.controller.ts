import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { TenantMemberInvitationService } from '../application/tenant-member-invitation.service.js';
import { CreateTenantAdminInvitationDto } from '../application/dto/request/invitation.request.dto.js';
import {
  CreateTenantAdminInvitationResponseDto,
  TenantAdminInvitationListResponseDto,
  TenantAdminInvitationResponseDto,
} from '../application/dto/response/invitation.response.dto.js';

/** Prefer this path for tenant member invites */
@ApiTags('Tenant Member Invitations')
@ApiBearerAuth()
@Controller('tenant/:tenantId/member-invitation')
export class TenantMemberInvitationController {
  constructor(private readonly service: TenantMemberInvitationService) {}

  @Get()
  @RequireTenantPermissions(TenantPermission.INVITE_READ)
  @ApiOperation({ summary: 'List tenant member invitations' })
  @ApiOkResponse({ type: TenantAdminInvitationListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20);
  }

  @Post()
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Invite a tenant member (non-admin)' })
  @ApiCreatedResponse({ type: CreateTenantAdminInvitationResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantAdminInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user.userId);
  }

  @Post(':id/resend')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Resend a pending member invitation with a new token' })
  @ApiOkResponse({ type: CreateTenantAdminInvitationResponseDto })
  resend(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resend(tenantId, id);
  }

  @Delete(':id')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending member invitation' })
  @ApiOkResponse({ type: TenantAdminInvitationResponseDto })
  cancel(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(tenantId, id);
  }
}
