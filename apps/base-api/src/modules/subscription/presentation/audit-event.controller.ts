import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto, PlatformPermission, RequirePermissions } from '@app/common';
import { AuditQueryService } from '../application/audit-query.service.js';
import {
  AuditEventListResponseDto,
  AuditEventQueryDto,
  AuditEventSearchInput,
} from '../application/dto/audit.dto.js';

@ApiTags('Platform Audit')
@ApiBearerAuth()
@Controller('platform/audit-event')
export class AuditEventController {
  constructor(private readonly auditQuery: AuditQueryService) {}

  @Get()
  @RequirePermissions(PlatformPermission.AUDIT_READ)
  @ApiOperation({ summary: 'Search platform audit events' })
  @ApiOkResponse({ type: AuditEventListResponseDto })
  search(@Query() filters: AuditEventQueryDto, @Query() pagination: PaginationQueryDto) {
    return this.auditQuery.search(
      AuditEventSearchInput.fromQuery(filters),
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }
}
