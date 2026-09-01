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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto, PlatformPermission, RequirePermissions } from '@app/common';
import { TenantService } from '../application/tenant.service.js';
import { CreateTenantDto, OnboardTenantDto, UpdateTenantDto } from '../application/dto/request/tenant.request.dto.js';
import {
  OnboardTenantResponseDto,
  TenantListResponseDto,
  TenantResponseDto,
} from '../application/dto/response/tenant.response.dto.js';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('onboard')
  @RequirePermissions(PlatformPermission.TENANT_CREATE)
  @ApiOperation({ summary: 'Onboard tenant with institution profile (transactional)' })
  @ApiCreatedResponse({ type: OnboardTenantResponseDto })
  onboard(@Body() dto: OnboardTenantDto) {
    return this.tenantService.onboard(dto);
  }

  @Post()
  @RequirePermissions(PlatformPermission.TENANT_CREATE)
  @ApiOperation({ summary: 'Create tenant' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'List tenants' })
  @ApiOkResponse({ type: TenantListResponseDto })
  findAll(@Query() query: PaginationQueryDto) {
    return this.tenantService.findAll(query.page, query.limit);
  }

  @Get(':tenantId')
  @RequirePermissions(PlatformPermission.TENANT_READ)
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiOkResponse({ type: TenantResponseDto })
  findById(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  @Patch(':tenantId')
  @RequirePermissions(PlatformPermission.TENANT_UPDATE)
  @ApiOperation({ summary: 'Update tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(tenantId, dto);
  }

  @Delete(':tenantId')
  @RequirePermissions(PlatformPermission.TENANT_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant (cascade)' })
  @ApiNoContentResponse()
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantService.delete(tenantId);
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
