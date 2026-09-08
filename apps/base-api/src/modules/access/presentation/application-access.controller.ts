import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
  RequireTenantPermissions,
  TenantPermission,
  type AuthenticatedUser,
} from '@app/common';
import { ApplicationAccessService } from '../application/application-access.service.js';
import {
  ApplicationAccessListResponseDto,
  ApplicationAccessQueryDto,
  ApplicationAccessResponseDto,
  ApplicationPermissionResponseDto,
  ApplicationRoleResponseDto,
  CreateApplicationAccessDto,
  ListApplicationRolesQueryDto,
  UpdateApplicationAccessDto,
} from '../application/dto/access.dto.js';

@ApiTags('Application Access')
@ApiBearerAuth()
@Controller('tenant/:tenantId/application-access')
export class TenantApplicationAccessController {
  constructor(private readonly service: ApplicationAccessService) {}

  @Get('roles')
  @RequireTenantPermissions(TenantPermission.MEMBERS_READ)
  @ApiOperation({
    summary: 'List application system roles (Tenant Admin)',
    description: 'Filter with applicationCode=ALUMNI for ALUMNI_MEMBER and ALUMNI_ADMIN.',
  })
  @ApiOkResponse({ type: [ApplicationRoleResponseDto] })
  listRoles(
    @Param('tenantId', ParseUUIDPipe) _tenantId: string,
    @Query() query: ListApplicationRolesQueryDto,
  ) {
    return this.service.listRolesForApplication(query.applicationCode);
  }

  @Get('applications/:applicationId/permissions')
  @RequireTenantPermissions(TenantPermission.MEMBERS_READ)
  @ApiOperation({ summary: 'List permissions for an application (Tenant Admin)' })
  @ApiOkResponse({ type: [ApplicationPermissionResponseDto] })
  listPermissions(
    @Param('tenantId', ParseUUIDPipe) _tenantId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.service.listPermissionsForApplication(applicationId);
  }

  @Get()
  @RequireTenantPermissions(TenantPermission.MEMBERS_READ)
  @ApiOperation({
    summary: 'List application access assignments for a tenant',
    description:
      'Shows which members can enter which entitled applications (Alumni portal / Alumni admin).',
  })
  @ApiOkResponse({ type: ApplicationAccessListResponseDto })
  list(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: ApplicationAccessQueryDto,
  ) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequireTenantPermissions(TenantPermission.MEMBERS_READ)
  @ApiOperation({ summary: 'Get application access assignment' })
  @ApiOkResponse({ type: ApplicationAccessResponseDto })
  get(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.get(tenantId, id);
  }

  @Post()
  @RequireTenantPermissions(TenantPermission.MEMBERS_MANAGE)
  @ApiOperation({
    summary: 'Assign application access to a tenant member',
    description:
      'Requires ACTIVE membership + ACTIVE tenant entitlement. Use ALUMNI_MEMBER for member portal or ALUMNI_ADMIN for admin portal.',
  })
  @ApiCreatedResponse({ type: ApplicationAccessResponseDto })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateApplicationAccessDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user.userId);
  }

  @Patch(':id')
  @RequireTenantPermissions(TenantPermission.MEMBERS_MANAGE)
  @ApiOperation({ summary: 'Update application access assignment (role, status, default)' })
  @ApiOkResponse({ type: ApplicationAccessResponseDto })
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationAccessDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(tenantId, id, dto, user.userId);
  }
}

@ApiTags('Application Access')
@ApiBearerAuth()
@Controller('application-access')
export class ApplicationAccessCatalogController {
  constructor(private readonly service: ApplicationAccessService) {}

  @Get('roles')
  @ApiOperation({
    summary: 'List application system roles',
    description:
      'Any authenticated user. Prefer /tenant/:tenantId/application-access/roles for Tenant Admin flows.',
  })
  @ApiOkResponse({ type: [ApplicationRoleResponseDto] })
  listRoles(@Query() query: ListApplicationRolesQueryDto) {
    return this.service.listRolesForApplication(query.applicationCode);
  }

  @Get('applications/:applicationId/permissions')
  @ApiOperation({ summary: 'List permissions for an application' })
  @ApiOkResponse({ type: [ApplicationPermissionResponseDto] })
  listPermissions(@Param('applicationId', ParseUUIDPipe) applicationId: string) {
    return this.service.listPermissionsForApplication(applicationId);
  }
}
