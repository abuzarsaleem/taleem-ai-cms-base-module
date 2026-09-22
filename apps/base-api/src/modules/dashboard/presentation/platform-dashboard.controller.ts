import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformPermission, RequirePermissions } from '@app/common';
import { PlatformDashboardService } from '../application/platform-dashboard.service.js';
import { PlatformDashboardLimitQueryDto } from '../application/dto/platform-dashboard.request.dto.js';
import {
  PlatformDashboardActivityResponseDto,
  PlatformDashboardApplicationsResponseDto,
  PlatformDashboardAttentionResponseDto,
  PlatformDashboardCountsResponseDto,
  PlatformDashboardRecentTenantsResponseDto,
  PlatformDashboardSystemStatusResponseDto,
} from '../application/dto/platform-dashboard.response.dto.js';

@ApiTags('Platform Dashboard')
@ApiBearerAuth()
@Controller('platform/dashboard')
export class PlatformDashboardController {
  constructor(private readonly service: PlatformDashboardService) {}

  @Get('counts')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({
    summary: 'Platform overview counts',
    description:
      'Tenants, active tenants, onboarding, and applications with vs-previous-month deltas.',
  })
  @ApiOkResponse({ type: PlatformDashboardCountsResponseDto })
  getCounts() {
    return this.service.getCounts();
  }

  @Get('attention')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({
    summary: 'Requires attention items',
    description:
      'Actionable counts: awaiting activation, incomplete setup (missing identifier, primary contact, SMTP, or address), OAuth issues, pending onboarding tasks.',
  })
  @ApiOkResponse({ type: PlatformDashboardAttentionResponseDto })
  getAttention() {
    return this.service.getAttention();
  }

  @Get('applications')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Application catalogue slice for the dashboard' })
  @ApiOkResponse({ type: PlatformDashboardApplicationsResponseDto })
  getApplications(@Query() query: PlatformDashboardLimitQueryDto) {
    return this.service.getApplications(query);
  }

  @Get('recent-tenants')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Recently joined tenants' })
  @ApiOkResponse({ type: PlatformDashboardRecentTenantsResponseDto })
  getRecentTenants(@Query() query: PlatformDashboardLimitQueryDto) {
    return this.service.getRecentTenants(query);
  }

  @Get('activity')
  @RequirePermissions(PlatformPermission.AUDIT_READ)
  @ApiOperation({ summary: 'Recent platform activity feed' })
  @ApiOkResponse({ type: PlatformDashboardActivityResponseDto })
  getActivity(@Query() query: PlatformDashboardLimitQueryDto) {
    return this.service.getActivity(query);
  }

  @Get('system-status')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({
    summary: 'System status components',
    description: 'Health of Platform API, database, file storage, SMTP, and related integrations.',
  })
  @ApiOkResponse({ type: PlatformDashboardSystemStatusResponseDto })
  getSystemStatus() {
    return this.service.getSystemStatus();
  }
}
