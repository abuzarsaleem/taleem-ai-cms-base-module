import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '@app/common';
import { SocialAuthService } from '../application/social-auth.service.js';

@ApiExcludeController()
@ApiTags('Social Auth')
@Controller('auth/social')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth login' })
  google(@Res() res: Response) {
    const { authorizationUrl } = this.socialAuthService.startGoogleLogin();
    return res.redirect(authorizationUrl);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback — issues platform tokens as JSON' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.socialAuthService.handleGoogleCallback(code, state);
  }
}
