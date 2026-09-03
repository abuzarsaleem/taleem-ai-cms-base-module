import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, Public, type AuthenticatedUser } from '@app/common';
import { AuthService } from '../application/auth.service.js';
import { AuthTokenResponseDto, LoginDto, LogoutDto, RefreshTokenDto } from '../application/dto/auth.dto.js';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResendVerificationResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
} from '../application/dto/verification.dto.js';
import { UserVerificationService } from '../application/user-verification.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: UserVerificationService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT' })
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiOkResponse({ type: ForgotPasswordResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.verificationService.requestPasswordReset(dto.email, req.ip);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiOkResponse({ type: ResetPasswordResponseDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.verificationService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address using token from email' })
  @ApiOkResponse({ type: VerifyEmailResponseDto })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verificationService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link to current user' })
  @ApiOkResponse({ type: ResendVerificationResponseDto })
  resendVerification(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.verificationService.sendEmailVerification(user.userId, req.ip);
  }
}
