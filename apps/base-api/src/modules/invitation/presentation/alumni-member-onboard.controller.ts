import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '@app/common';
import { ApiKeyGuard } from '../../auth/infrastructure/guards/api-key.guard.js';
import { AlumniMemberOnboardService } from '../application/alumni-member-onboard.service.js';
import {
  AlumniMemberOnboardDto,
  AlumniMemberOnboardResponseDto,
} from '../application/dto/request/alumni-member-onboard.dto.js';

@ApiTags('Alumni Member Onboard')
@Controller('public/tenants/:tenantId')
export class AlumniMemberOnboardController {
  constructor(private readonly service: AlumniMemberOnboardService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Post('alumni-member-onboard')
  @ApiSecurity('api-key')
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'PUBLIC_REGISTRATION_API_KEY shared with Alumni CMS',
  })
  @ApiOperation({
    summary: 'Onboard an Alumni member onto the base platform (M2M)',
    description:
      'Called by Alumni CMS during member creation. If the email is already an ACTIVE tenant member, grants ALUMNI_MEMBER application access. Otherwise creates a base tenant-member invitation, emails the accept link, and grants ALUMNI_MEMBER automatically when the invitation is accepted.',
  })
  @ApiCreatedResponse({ type: AlumniMemberOnboardResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid API key' })
  onboard(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: AlumniMemberOnboardDto,
  ) {
    return this.service.onboard(tenantId, dto);
  }
}
