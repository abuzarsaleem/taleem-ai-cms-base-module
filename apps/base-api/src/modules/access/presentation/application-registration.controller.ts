import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  PlatformPermission,
  RequirePermissions,
  type AuthenticatedUser,
} from '@app/common';
import { ApplicationRegistrationService } from '../application/application-registration.service.js';
import { RegisterApplicationDto } from '../../subscription/application/dto/request/subscription.request.dto.js';
import { RegisterApplicationResponseDto } from '../../subscription/application/dto/response/subscription.response.dto.js';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('application')
export class ApplicationRegistrationController {
  constructor(private readonly service: ApplicationRegistrationService) {}

  @Post('register')
  @RequirePermissions(PlatformPermission.SUBSCRIPTION_MANAGE)
  @ApiOperation({
    summary: 'Register an application with optional system roles',
    description:
      'Creates the application and any provided SYSTEM roles in one request. Permissions can be attached later via role endpoints.',
  })
  @ApiCreatedResponse({ type: RegisterApplicationResponseDto })
  register(@Body() dto: RegisterApplicationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.register(dto, user.userId);
  }
}
