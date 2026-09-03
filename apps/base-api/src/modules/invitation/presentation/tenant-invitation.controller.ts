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
  ApiQuery,
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
  CreateTenantInvitationDto,
} from '../application/dto/request/invitation.request.dto.js';
import {
  CreateTenantInvitationResponseDto,
  TenantInvitationListResponseDto,
  TenantInvitationResponseDto,
} from '../application/dto/response/invitation.response.dto.js';

@ApiTags('Tenant Invitations')
@ApiBearerAuth()
@Controller('tenant/:tenantId/invitation')
export class TenantInvitationController {
  constructor(private readonly service: TenantInvitationService) {}

  @Get()
  @RequireTenantPermissions(TenantPermission.INVITE_READ)
  @ApiOperation({ summary: 'List tenant invitations' })
  @ApiQuery({ name: 'role', enum: MembershipRole, required: false })
  @ApiOkResponse({ type: TenantInvitationListResponseDto })
  list(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() q: PaginationQueryDto,
    @Query('role') role?: MembershipRole,
  ) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20, role);
  }

  @Post()
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Invite a tenant admin or member' })
  @ApiCreatedResponse({ type: CreateTenantInvitationResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user.userId);
  }

  @Post(':id/resend')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @ApiOperation({ summary: 'Resend a pending invitation with a new token' })
  @ApiOkResponse({ type: CreateTenantInvitationResponseDto })
  resend(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resend(tenantId, id);
  }

  @Delete(':id')
  @RequireTenantPermissions(TenantPermission.INVITE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  @ApiOkResponse({ type: TenantInvitationResponseDto })
  cancel(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(tenantId, id);
  }
}

@ApiTags('Auth')
@Controller('auth')
export class InvitationAcceptController {
  constructor(private readonly acceptService: InvitationAcceptService) {}

  @Public()
  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept invitation via the single email link token' })
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.acceptService.accept(dto);
  }
}
