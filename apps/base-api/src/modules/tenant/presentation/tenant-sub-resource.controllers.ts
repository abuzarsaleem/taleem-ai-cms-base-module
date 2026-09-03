import { ApiExcludeController } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedAssetFile } from '../application/uploaded-asset-file.js';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto, RequireTenantPermissions, TenantPermission } from '@app/common';
import {
  TenantAddressService,
  TenantAssetService,
  TenantConfigurationService,
  TenantContactService,
  TenantIdentifierService,
  TenantSmtpService,
  InstitutionProfileService,
} from '../application/tenant-sub-resource.services.js';
import {
  CreateInstitutionProfileDto,
  CreateTenantAddressDto,
  CreateTenantAssetDto,
  CreateTenantConfigurationDto,
  CreateTenantContactDto,
  CreateTenantIdentifierDto,
  CreateTenantSmtpDto,
  UpdateInstitutionProfileDto,
  UpdateTenantAddressDto,
  UpdateTenantAssetDto,
  UpdateTenantConfigurationDto,
  UpdateTenantContactDto,
  UpdateTenantIdentifierDto,
  UpdateTenantSmtpDto,
} from '../application/dto/request/tenant.request.dto.js';
import { UploadTenantAssetDto } from '../application/dto/request/upload-tenant-asset.dto.js';
import { AssetType } from '../domain/tenant.types.js';
import {
  InstitutionProfileResponseDto,
  TenantAddressListResponseDto,
  TenantAddressResponseDto,
  TenantAssetListResponseDto,
  TenantAssetResponseDto,
  TenantConfigurationResponseDto,
  TenantContactListResponseDto,
  TenantContactResponseDto,
  TenantIdentifierListResponseDto,
  TenantIdentifierResponseDto,
  TenantSmtpResponseDto,
} from '../application/dto/response/tenant.response.dto.js';

@ApiTags('Tenant Contacts')
@ApiBearerAuth()
@Controller('tenant/:tenantId/contact')
export class TenantContactController {
  constructor(private readonly service: TenantContactService) {}

  @Get() @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'List contacts' }) @ApiOkResponse({ type: TenantContactListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20);
  }

  @Get(':id') @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'Get contact' }) @ApiOkResponse({ type: TenantContactResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Create contact' }) @ApiCreatedResponse({ type: TenantContactResponseDto })
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: CreateTenantContactDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Update contact' }) @ApiOkResponse({ type: TenantContactResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantContactDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Delete contact' }) @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(tenantId, id);
  }
}

@ApiTags('Tenant Addresses')
@ApiBearerAuth()
@Controller('tenant/:tenantId/address')
export class TenantAddressController {
  constructor(private readonly service: TenantAddressService) {}

  @Get() @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'List addresses' }) @ApiOkResponse({ type: TenantAddressListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20);
  }

  @Get(':id') @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'Get address' }) @ApiOkResponse({ type: TenantAddressResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Create address' }) @ApiCreatedResponse({ type: TenantAddressResponseDto })
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: CreateTenantAddressDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Update address' }) @ApiOkResponse({ type: TenantAddressResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantAddressDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Delete address' }) @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(tenantId, id);
  }
}

@ApiTags('Tenant Identifiers')
@ApiBearerAuth()
@Controller('tenant/:tenantId/identifier')
export class TenantIdentifierController {
  constructor(private readonly service: TenantIdentifierService) {}

  @Get() @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'List identifiers' }) @ApiOkResponse({ type: TenantIdentifierListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20);
  }

  @Get(':id') @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'Get identifier' }) @ApiOkResponse({ type: TenantIdentifierResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Create identifier' }) @ApiCreatedResponse({ type: TenantIdentifierResponseDto })
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: CreateTenantIdentifierDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Update identifier' }) @ApiOkResponse({ type: TenantIdentifierResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantIdentifierDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Delete identifier' }) @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(tenantId, id);
  }
}

@ApiTags('Tenant Configuration')
@ApiBearerAuth()
@Controller('tenant/:tenantId/configuration')
export class TenantConfigurationController {
  constructor(private readonly service: TenantConfigurationService) {}

  @Get() @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'Get tenant configuration' }) @ApiOkResponse({ type: TenantConfigurationResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.get(tenantId);
  }

  @Post() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Create tenant configuration' }) @ApiCreatedResponse({ type: TenantConfigurationResponseDto })
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: CreateTenantConfigurationDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Update tenant configuration' }) @ApiOkResponse({ type: TenantConfigurationResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: UpdateTenantConfigurationDto) {
    return this.service.update(tenantId, dto);
  }

  @Delete() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Delete tenant configuration' }) @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.delete(tenantId);
  }
}

@ApiTags('Tenant SMTP')
@ApiBearerAuth()
@Controller('tenant/:tenantId/smtp')
export class TenantSmtpController {
  constructor(private readonly service: TenantSmtpService) {}

  @Get() @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'Get SMTP configuration' }) @ApiOkResponse({ type: TenantSmtpResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.get(tenantId);
  }

  @Post() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Create SMTP configuration' }) @ApiCreatedResponse({ type: TenantSmtpResponseDto })
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: CreateTenantSmtpDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Update SMTP configuration' }) @ApiOkResponse({ type: TenantSmtpResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: UpdateTenantSmtpDto) {
    return this.service.update(tenantId, dto);
  }

  @Delete() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Delete SMTP configuration' }) @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.delete(tenantId);
  }
}

@ApiTags('Tenant Assets')
@ApiBearerAuth()
@Controller('tenant/:tenantId/asset')
export class TenantAssetController {
  constructor(private readonly service: TenantAssetService) {}

  @Get() @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'List assets' }) @ApiOkResponse({ type: TenantAssetListResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() q: PaginationQueryDto) {
    return this.service.list(tenantId, q.page ?? 1, q.limit ?? 20);
  }

  @Get(':id') @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'Get asset' }) @ApiOkResponse({ type: TenantAssetResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(tenantId, id);
  }

  @Post('upload')
  @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadTenantAssetDto })
  @ApiOperation({ summary: 'Upload asset file (image or PDF)' })
  @ApiCreatedResponse({ type: TenantAssetResponseDto })
  upload(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @UploadedFile() file: UploadedAssetFile,
    @Body('assetType', new ParseEnumPipe(AssetType)) assetType: AssetType,
  ) {
    return this.service.upload(tenantId, file, assetType);
  }

  @Post() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Create asset metadata with external URL' }) @ApiCreatedResponse({ type: TenantAssetResponseDto })
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: CreateTenantAssetDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Update asset' }) @ApiOkResponse({ type: TenantAssetResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantAssetDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id') @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Delete asset' }) @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(tenantId, id);
  }
}

@ApiExcludeController()
@Controller('tenant/:tenantId/institution-profile')
export class InstitutionProfileController {
  constructor(private readonly service: InstitutionProfileService) {}

  @Get() @RequireTenantPermissions(TenantPermission.PROFILE_READ) @ApiOperation({ summary: 'Get institution profile' }) @ApiOkResponse({ type: InstitutionProfileResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.get(tenantId);
  }

  @Post() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Create institution profile' }) @ApiCreatedResponse({ type: InstitutionProfileResponseDto })
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: CreateInstitutionProfileDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @ApiOperation({ summary: 'Update institution profile' }) @ApiOkResponse({ type: InstitutionProfileResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: UpdateInstitutionProfileDto) {
    return this.service.update(tenantId, dto);
  }

  @Delete() @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE) @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Delete institution profile' }) @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.delete(tenantId);
  }
}
