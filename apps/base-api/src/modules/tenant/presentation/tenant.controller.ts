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
  PlatformPermission,
  RequirePermissions,
  RequireTenantPermissions,
  TenantPermission,
} from '@app/common';
import { TenantService } from '../application/tenant.service.js';
import { CreateTenantDto, UpdateTenantDto } from '../application/dto/request/tenant.request.dto.js';
import { PlatformTenantQueryDto } from '../application/dto/request/platform-list.query.dto.js';
import {
  TenantListResponseDto,
  TenantResponseDto,
} from '../application/dto/response/tenant.response.dto.js';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @RequirePermissions(PlatformPermission.TENANT_CREATE)
  @ApiOperation({ summary: 'Create tenant' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List all tenants (platform admin)' })
  @ApiOkResponse({ type: TenantListResponseDto })
  findAll(@Query() query: PlatformTenantQueryDto) {
    const { page, limit, ...filters } = query;
    return this.tenantService.findAll(page ?? 1, limit ?? 20, filters);
  }

  @Get(':tenantId')
  @RequireTenantPermissions(TenantPermission.PROFILE_READ)
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiOkResponse({ type: TenantResponseDto })
  findById(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  @Patch(':tenantId')
  @RequireTenantPermissions(TenantPermission.PROFILE_UPDATE)
  @ApiOperation({ summary: 'Update tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(tenantId, dto);
  }

  @Post(':tenantId/activate')
  @RequirePermissions(PlatformPermission.TENANT_UPDATE)
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  activate(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantService.activate(tenantId);
  }

  @Post(':tenantId/suspend')
  @RequirePermissions(PlatformPermission.TENANT_SUSPEND)
  @ApiOperation({ summary: 'Suspend tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  suspend(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantService.suspend(tenantId);
  }

  @Post(':tenantId/retire')
  @RequirePermissions(PlatformPermission.TENANT_SUSPEND)
  @ApiOperation({ summary: 'Retire tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  retire(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantService.retire(tenantId);
  }
}
