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
import { ApplicantMemberOnboardService } from '../application/applicant-member-onboard.service.js';
import {
  ApplicantMemberOnboardDto,
  ApplicantMemberOnboardResponseDto,
} from '../application/dto/request/applicant-member-onboard.dto.js';

@ApiTags('Applicant Member Onboard')
@Controller('public/tenants/:tenantId')
export class ApplicantMemberOnboardController {
  constructor(private readonly service: ApplicantMemberOnboardService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Post('applicant-member-onboard')
  @ApiSecurity('api-key')
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'PUBLIC_REGISTRATION_API_KEY shared with Admissions portal',
  })
  @ApiOperation({
    summary: 'Onboard an Admissions applicant onto the base platform (M2M)',
    description:
      'Called by Admissions portal during ADM-F001 registration. If the email is already an ACTIVE tenant member, grants ADMISSIONS_APPLICANT application access. Otherwise creates a tenant-member invitation (no IAM email) so Admissions can send the verification/activate link.',
  })
  @ApiCreatedResponse({ type: ApplicantMemberOnboardResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing/invalid API key' })
  onboard(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: ApplicantMemberOnboardDto,
  ) {
    return this.service.onboard(tenantId, dto);
  }
}
