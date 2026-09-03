import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import { TenantAvailabilityService } from '../application/tenant-availability.service.js';
import {
  ApplicationAccessResponseDto,
  TenantAvailabilityResponseDto,
} from '../application/dto/response/subscription.response.dto.js';

@ApiTags('Tenant Application Availability')
@ApiBearerAuth()
@Controller('tenant/:tenantId/application')
export class TenantAvailabilityController {
  constructor(private readonly service: TenantAvailabilityService) {}

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({
    summary: 'List applications currently available to the tenant',
    description: 'Derived from active, in-period entitlements whose application and subscription are valid.',
  })
  @ApiOkResponse({ type: TenantAvailabilityResponseDto })
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.list(tenantId);
  }

  @Get(':applicationCode/access')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Check whether the tenant is currently entitled to an application' })
  @ApiOkResponse({ type: ApplicationAccessResponseDto })
  access(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('applicationCode') applicationCode: string,
  ) {
    return this.service.access(tenantId, applicationCode);
  }
}
