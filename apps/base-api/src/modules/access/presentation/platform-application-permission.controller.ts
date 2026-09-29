import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import { ApplicationRoleService } from '../application/application-role.service.js';
import {
  ApplicationPermissionResponseDto,
  CreateApplicationPermissionDto,
} from '../application/dto/access.dto.js';

@ApiTags('Application Permissions')
@ApiBearerAuth()
@Controller('application/:applicationId/permissions')
export class PlatformApplicationPermissionController {
  constructor(private readonly service: ApplicationRoleService) {}

  @Post()
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Create an application permission (Platform Admin)' })
  @ApiCreatedResponse({ type: ApplicationPermissionResponseDto })
  create(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateApplicationPermissionDto,
  ) {
    return this.service.createPermission(applicationId, dto);
  }
}
