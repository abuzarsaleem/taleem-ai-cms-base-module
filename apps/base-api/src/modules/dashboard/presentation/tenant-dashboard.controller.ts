import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireTenantPermissions, TenantPermission } from '@app/common';
import { TenantDashboardService } from '../application/tenant-dashboard.service.js';
import { TenantDashboardResponseDto } from '../application/dto/tenant-dashboard.response.dto.js';

@ApiTags('Tenant Dashboard')
@ApiBearerAuth()
@Controller('tenant/:tenantId/dashboard')
export class TenantDashboardController {
  constructor(private readonly service: TenantDashboardService) {}

  @Get()
  @RequireTenantPermissions(TenantPermission.MEMBERS_READ)
  @ApiOperation({
    summary: 'Tenant dashboard KPIs',
    description:
      'Aggregated members, pending invitations, entitled applications, profile completeness, and subscription/entitlement summaries for a single tenant.',
  })
  @ApiOkResponse({ type: TenantDashboardResponseDto })
  get(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.service.get(tenantId);
  }
}
