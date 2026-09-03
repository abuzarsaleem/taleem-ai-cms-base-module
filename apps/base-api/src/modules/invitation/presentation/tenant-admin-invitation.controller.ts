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
  Public,
  type AuthenticatedUser,
} from '@app/common';
import { AuthTokenResponseDto } from '../../auth/application/dto/auth.dto.js';
import { TenantAdminInvitationService } from '../application/tenant-admin-invitation.service.js';
import {
  AcceptInvitationDto,
  CreateTenantAdminInvitationDto,
} from '../application/dto/request/invitation.request.dto.js';
import {
  CreateTenantAdminInvitationResponseDto,
  TenantAdminInvitationListResponseDto,
  TenantAdminInvitationResponseDto,
} from '../application/dto/response/invitation.response.dto.js';

/** Prefer this path for tenant admin invites */
@ApiTags('Tenant Admin Invitations')
@ApiBearerAuth()
@Controller('tenant/:tenantId/admin-invitation')
export class TenantAdminInvitationController {
  constructor(private readonly service: TenantAdminInvitationService) {}

  @Get()
  @RequireTenantPermissions(TenantPermission.INVITE_READ)
  @ApiOperation({ summary: 'List tenant admin invitations' })
  @ApiOkResponse({ type: TenantAdminInvitationListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20);
  }

  @Post()
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Invite a tenant administrator' })
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
  @ApiOperation({ summary: 'Resend a pending invitation with a new token' })
  @ApiOkResponse({ type: CreateTenantAdminInvitationResponseDto })
  resend(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resend(tenantId, id);
  }

  @Delete(':id')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  @ApiOkResponse({ type: TenantAdminInvitationResponseDto })
  cancel(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(tenantId, id);
  }
}

@ApiTags('Auth')
@Controller('auth')
export class InvitationAcceptController {
  constructor(private readonly service: TenantAdminInvitationService) {}

  @Public()
  @Post('accept-invitation')
  @ApiOperation({
    summary: 'Accept invitation (admin or member) via the single email link token',
  })
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.service.accept(dto);
  }
}
