import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  PaginationQueryDto,
  PlatformPermission,
  RequirePermissions,
  type AuthenticatedUser,
} from '@app/common';
import { ApplicationCatalogService } from '../application/application-catalog.service.js';
import { TenantAvailabilityService } from '../application/tenant-availability.service.js';
import { CreateApplicationDto, UpdateApplicationDto } from '../application/dto/request/subscription.request.dto.js';
import { UploadApplicationLogoDto } from '../application/dto/request/upload-application-logo.dto.js';
import {
  ApplicationListResponseDto,
  ApplicationResponseDto,
  ApplicationAccessResponseDto,
  TenantAvailabilityResponseDto,
} from '../application/dto/response/subscription.response.dto.js';
import type { UploadedAssetFile } from '../../tenant/application/uploaded-asset-file.js';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('application')
export class ApplicationCatalogController {
  constructor(private readonly service: ApplicationCatalogService) {}

  @Post()
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Register an application in the platform catalog' })
  @ApiCreatedResponse({ type: ApplicationResponseDto })
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List registered applications' })
  @ApiOkResponse({ type: ApplicationListResponseDto })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query.page ?? 1, query.limit ?? 20);
  }

  @Get(':applicationId')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  findById(@Param('applicationId', ParseUUIDPipe) applicationId: string) {
    return this.service.findById(applicationId);
  }

  @Patch(':applicationId')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Update application catalog details' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  update(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(applicationId, dto, user.userId);
  }

  @Post(':applicationId/logo')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadApplicationLogoDto })
  @ApiOperation({ summary: 'Upload application logo image' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  uploadLogo(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @UploadedFile() file: UploadedAssetFile,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.uploadLogo(applicationId, file, user.userId);
  }

  @Delete(':applicationId/logo')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({ summary: 'Remove application logo' })
  @ApiOkResponse({ type: ApplicationResponseDto })
  removeLogo(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.removeLogo(applicationId, user.userId);
  }

  @Post(':applicationId/deactivate')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Mark application ineligible',
    description: 'New entitlements are rejected. Existing entitlements remain but drop out of availability.',
  })
  @ApiOkResponse({ type: ApplicationResponseDto })
  deactivate(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.deactivate(applicationId, user.userId);
  }
}

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('tenant/:tenantId/application')
export class TenantAvailabilityController {
  constructor(private readonly service: TenantAvailabilityService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({
    summary: 'List applications currently available to the tenant',
    description: 'Derived from ACTIVE, in-period entitlements whose application and subscription are in force.',
  })
  @ApiOkResponse({ type: TenantAvailabilityResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.list(tenantId);
  }

  @Get(':applicationCode/access')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({
    summary: 'Check whether the tenant is currently entitled to an application',
  })
  @ApiOkResponse({ type: ApplicationAccessResponseDto })
  access(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('applicationCode') applicationCode: string,
  ) {
    return this.service.access(tenantId, applicationCode);
  }
}
