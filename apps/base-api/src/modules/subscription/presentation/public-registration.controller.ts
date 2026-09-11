import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '@app/common';
import { ApiKeyGuard } from '../../auth/infrastructure/guards/api-key.guard.js';
import { RegistrationTenantsService } from '../application/registration-tenants.service.js';

class RegistrationTenantResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'university-of-lahore' }) code!: string;
  @ApiProperty({ example: 'Test University' }) displayName!: string;
}

@ApiTags('Public Registration')
@Controller('public')
export class PublicRegistrationController {
  constructor(private readonly registrationTenants: RegistrationTenantsService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get('tenants-for-registration')
  @ApiSecurity('api-key')
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'PUBLIC_REGISTRATION_API_KEY shared with CMS',
  })
  @ApiQuery({
    name: 'applicationCode',
    required: false,
    example: 'ALUMNI',
    description: 'Application code to filter entitled tenants (default ALUMNI)',
  })
  @ApiOperation({
    summary: 'List ACTIVE tenants entitled for public alumni registration',
  })
  @ApiOkResponse({ type: [RegistrationTenantResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid API key' })
  listTenants(@Query('applicationCode') applicationCode?: string) {
    return this.registrationTenants.listForRegistration(
      applicationCode?.trim() || 'ALUMNI',
    );
  }
}
