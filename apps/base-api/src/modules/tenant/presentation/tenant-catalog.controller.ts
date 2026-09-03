import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common';
import { TenantCatalogService } from '../application/tenant-catalog.service.js';

class CatalogItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() isActive!: boolean;
}

@ApiTags('Catalog')
@Controller('catalog')
export class TenantCatalogController {
  constructor(private readonly catalogService: TenantCatalogService) {}

  @Public()
  @Get('department')
  @ApiOperation({ summary: 'List active departments (seeded catalog)' })
  @ApiOkResponse({ type: [CatalogItemResponseDto] })
  listDepartments() {
    return this.catalogService.listDepartments();
  }

  @Public()
  @Get('designation')
  @ApiOperation({ summary: 'List active designations (seeded catalog)' })
  @ApiOkResponse({ type: [CatalogItemResponseDto] })
  listDesignations() {
    return this.catalogService.listDesignations();
  }

  @Public()
  @Get('identifier-type')
  @ApiOperation({ summary: 'List active identifier types (seeded catalog)' })
  @ApiOkResponse({ type: [CatalogItemResponseDto] })
  listIdentifierTypes() {
    return this.catalogService.listIdentifierTypes();
  }
}
