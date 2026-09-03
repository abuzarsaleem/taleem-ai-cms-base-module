import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type AuthenticatedUser } from '@app/common';
import { OauthAuthorizationService } from '../application/oauth-authorization.service.js';
import {
  OAuthAuthorizeQueryDto,
  OAuthConsentDto,
} from '../application/dto/request/oauth.request.dto.js';
import {
  OAuthAuthorizePreviewResponseDto,
  OAuthConsentResponseDto,
} from '../application/dto/response/oauth.response.dto.js';

@ApiTags('OAuth')
@ApiBearerAuth()
@Controller('oauth/authorize')
export class OauthAuthorizationController {
  constructor(private readonly service: OauthAuthorizationService) {}

  @Get()
  @ApiOperation({ summary: 'Preview OAuth authorization request (requires login)' })
  @ApiOkResponse({ type: OAuthAuthorizePreviewResponseDto })
  preview(@CurrentUser() user: AuthenticatedUser, @Query() query: OAuthAuthorizeQueryDto) {
    return this.service.previewAuthorize(user.userId, query);
  }

  @Post('consent')
  @ApiOperation({ summary: 'Approve or deny OAuth consent and receive authorization code redirect' })
  @ApiCreatedResponse({ type: OAuthConsentResponseDto })
  consent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OAuthConsentDto,
    @Req() req: Request,
  ) {
    return this.service.submitConsent(
      user.userId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
