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
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import { ApplicationRoleService } from '../application/application-role.service.js';
import {
  AddApplicationRolePermissionsDto,
  ApplicationRoleResponseDto,
  CreateApplicationRoleDto,
  UpdateApplicationRoleDto,
} from '../application/dto/access.dto.js';

@ApiTags('Application Roles')
@ApiBearerAuth()
@Controller('application/:applicationId/roles')
export class PlatformApplicationRoleController {
  constructor(private readonly service: ApplicationRoleService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List system roles for an application (Platform Admin)' })
  @ApiOkResponse({ type: [ApplicationRoleResponseDto] })
  list(@Param('applicationId', ParseUUIDPipe) applicationId: string) {
    return this.service.list(applicationId);
  }

  @Post()
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Create an application role (Platform Admin)',
    description:
      'Creates a SYSTEM application role. Optionally grant application permissions (features) on create.',
  })
  @ApiCreatedResponse({ type: ApplicationRoleResponseDto })
  create(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateApplicationRoleDto,
  ) {
    return this.service.create(applicationId, dto);
  }

  @Get(':roleId')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Get an application role (Platform Admin)' })
  @ApiOkResponse({ type: ApplicationRoleResponseDto })
  get(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.service.get(applicationId, roleId);
  }

  @Patch(':roleId')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Update an application role (Platform Admin)',
    description: 'Updates roleName and/or description. Use permission endpoints to change features.',
  })
  @ApiOkResponse({ type: ApplicationRoleResponseDto })
  update(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateApplicationRoleDto,
  ) {
    return this.service.update(applicationId, roleId, dto);
  }

  @Post(':roleId/permissions')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Add permissions (features) to an application role',
    description: 'Idempotent for already-granted permissionIds.',
  })
  @ApiOkResponse({ type: ApplicationRoleResponseDto })
  addPermissions(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: AddApplicationRolePermissionsDto,
  ) {
    return this.service.addPermissions(applicationId, roleId, dto);
  }

  @Delete(':roleId/permissions/:permissionId')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a permission (feature) from an application role' })
  @ApiOkResponse({ type: ApplicationRoleResponseDto })
  removePermission(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.service.removePermission(applicationId, roleId, permissionId);
  }
}
