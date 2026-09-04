import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import {
  TenantAddressService,
  TenantAssetService,
  TenantConfigurationService,
  TenantContactService,
  TenantIdentifierService,
  TenantSmtpService,
} from '../application/tenant-sub-resource.services.js';
import {
  PlatformAddressQueryDto,
  PlatformAssetQueryDto,
  PlatformConfigurationQueryDto,
  PlatformContactQueryDto,
  PlatformIdentifierQueryDto,
  PlatformSmtpQueryDto,
} from '../application/dto/request/platform-list.query.dto.js';
import {
  TenantAddressListResponseDto,
  TenantAssetListResponseDto,
  TenantConfigurationListResponseDto,
  TenantContactListResponseDto,
  TenantIdentifierListResponseDto,
  TenantSmtpListResponseDto,
} from '../application/dto/response/tenant.response.dto.js';

@ApiTags('Tenant Contacts')
@ApiBearerAuth()
@Controller('platform/contact')
export class PlatformContactController {
  constructor(private readonly service: TenantContactService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List contacts across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantContactListResponseDto })
  listAll(@Query() q: PlatformContactQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}

@ApiTags('Tenant Addresses')
@ApiBearerAuth()
@Controller('platform/address')
export class PlatformAddressController {
  constructor(private readonly service: TenantAddressService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List addresses across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantAddressListResponseDto })
  listAll(@Query() q: PlatformAddressQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}

@ApiTags('Tenant Identifiers')
@ApiBearerAuth()
@Controller('platform/identifier')
export class PlatformIdentifierController {
  constructor(private readonly service: TenantIdentifierService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List identifiers across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantIdentifierListResponseDto })
  listAll(@Query() q: PlatformIdentifierQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}

@ApiTags('Tenant Configuration')
@ApiBearerAuth()
@Controller('platform/configuration')
export class PlatformConfigurationController {
  constructor(private readonly service: TenantConfigurationService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List configurations across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantConfigurationListResponseDto })
  listAll(@Query() q: PlatformConfigurationQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}

@ApiTags('Tenant SMTP')
@ApiBearerAuth()
@Controller('platform/smtp')
export class PlatformSmtpController {
  constructor(private readonly service: TenantSmtpService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List SMTP configs across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantSmtpListResponseDto })
  listAll(@Query() q: PlatformSmtpQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}

@ApiTags('Tenant Assets')
@ApiBearerAuth()
@Controller('platform/asset')
export class PlatformAssetController {
  constructor(private readonly service: TenantAssetService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List assets across all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantAssetListResponseDto })
  listAll(@Query() q: PlatformAssetQueryDto) {
    const { page, limit, ...filters } = q;
    return this.service.listAll(page ?? 1, limit ?? 20, filters);
  }
}
