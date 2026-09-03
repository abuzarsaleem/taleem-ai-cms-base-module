import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@app/common';
import { OauthTokenService } from '../application/oauth-token.service.js';
import {
  OAuthRevokeDto,
  OAuthTokenRequestDto,
} from '../application/dto/request/oauth.request.dto.js';
import { OAuthTokenResponseDto } from '../application/dto/response/oauth.response.dto.js';

@ApiTags('OAuth')
@Controller('oauth')
export class OauthTokenController {
  constructor(private readonly service: OauthTokenService) {}

  @Public()
  @Post('token')
  @ApiOperation({ summary: 'OAuth 2.0 token endpoint (authorization_code / refresh_token)' })
  @ApiCreatedResponse({ type: OAuthTokenResponseDto })
  token(@Body() dto: OAuthTokenRequestDto, @Req() req: Request) {
    return this.service.token(dto, req.ip);
  }

  @Public()
  @Post('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke OAuth refresh token (RFC 7009-style)' })
  @ApiNoContentResponse()
  revoke(@Body() dto: OAuthRevokeDto) {
    return this.service.revoke(dto);
  }
}
