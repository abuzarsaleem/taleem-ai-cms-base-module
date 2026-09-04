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
import { MembershipRole } from '../domain/membership.types.js';
import { InvitationAcceptService } from '../application/invitation-accept.service.js';
import { TenantInvitationService } from '../application/tenant-invitation.service.js';
import {
  AcceptInvitationDto,
  CreateTenantAdminInvitationDto,
} from '../application/dto/request/invitation.request.dto.js';
import {
  CreateTenantInvitationResponseDto,
  TenantInvitationListResponseDto,
  TenantInvitationResponseDto,
} from '../application/dto/response/invitation.response.dto.js';

@ApiTags('Tenant Admin Invitations')
@ApiBearerAuth()
@Controller('tenant/:tenantId/admin-invitation')
export class TenantAdminInvitationController {
  constructor(private readonly service: TenantInvitationService) {}

  @Get()
  @RequireTenantPermissions(TenantPermission.INVITE_READ)
  @ApiOperation({ summary: 'List tenant admin invitations' })
  @ApiOkResponse({ type: TenantInvitationListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20, MembershipRole.ADMIN);
  }

  @Post()
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Invite a tenant administrator' })
  @ApiCreatedResponse({ type: CreateTenantInvitationResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantAdminInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(
      tenantId,
      { email: dto.email, role: MembershipRole.ADMIN },
      user.userId,
    );
  }

  @Post(':id/resend')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Resend a pending admin invitation with a new token' })
  @ApiOkResponse({ type: CreateTenantInvitationResponseDto })
  resend(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resend(tenantId, id, MembershipRole.ADMIN);
  }

  @Delete(':id')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending admin invitation' })
  @ApiOkResponse({ type: TenantInvitationResponseDto })
  cancel(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(tenantId, id, MembershipRole.ADMIN);
  }
}

@ApiTags('Tenant Member Invitations')
@ApiBearerAuth()
@Controller('tenant/:tenantId/member-invitation')
export class TenantMemberInvitationController {
  constructor(private readonly service: TenantInvitationService) {}

  @Get()
  @RequireTenantPermissions(TenantPermission.INVITE_READ)
  @ApiOperation({ summary: 'List tenant member invitations' })
  @ApiOkResponse({ type: TenantInvitationListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20, MembershipRole.MEMBER);
  }

  @Post()
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Invite a tenant member (non-admin)' })
  @ApiCreatedResponse({ type: CreateTenantInvitationResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantAdminInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(
      tenantId,
      { email: dto.email, role: MembershipRole.MEMBER },
      user.userId,
    );
  }

  @Post(':id/resend')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Resend a pending member invitation with a new token' })
  @ApiOkResponse({ type: CreateTenantInvitationResponseDto })
  resend(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resend(tenantId, id, MembershipRole.MEMBER);
  }

  @Delete(':id')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending member invitation' })
  @ApiOkResponse({ type: TenantInvitationResponseDto })
  cancel(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(tenantId, id, MembershipRole.MEMBER);
  }
}

@ApiTags('Auth')
@Controller('auth')
export class InvitationAcceptController {
  constructor(private readonly acceptService: InvitationAcceptService) {}

  @Public()
  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept invitation (admin or member) via the single email link token' })
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.acceptService.accept(dto);
  }
}
