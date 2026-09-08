import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { IDENTITY_REPOSITORY } from '../../identity/domain/identity.repository.interface.js';
import type { IIdentityRepository } from '../../identity/domain/identity.repository.interface.js';
import {
  AuthenticationMethodType,
  IdentityStatus,
} from '../../identity/domain/identity.types.js';
import { AuthenticationMethodService } from '../../identity/application/authentication-method.service.js';
import { AuthTokenService } from './auth-token.service.js';

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class SocialAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authTokenService: AuthTokenService,
    @Inject(IDENTITY_REPOSITORY) private readonly userRepository: IIdentityRepository,
    private readonly authMethods: AuthenticationMethodService,
  ) {}

  startGoogleLogin() {
    const clientId = this.config.get<string>('auth.social.google.clientId');
    const redirectUri = this.config.get<string>('auth.social.google.redirectUri');
    if (!clientId || !redirectUri) {
      throw new ServiceUnavailableException('Google social login is not configured');
    }

    const state = this.jwtService.sign(
      { purpose: 'google_oauth', nonce: randomUUID() },
      { expiresIn: '10m' },
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });

    return {
      authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async handleGoogleCallback(code: string, state: string) {
    this.verifyState(state);

    const clientId = this.config.get<string>('auth.social.google.clientId');
    const clientSecret = this.config.get<string>('auth.social.google.clientSecret');
    const redirectUri = this.config.get<string>('auth.social.google.redirectUri');
    if (!clientId || !clientSecret || !redirectUri) {
      throw new ServiceUnavailableException('Google social login is not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new BadRequestException('Failed to exchange Google authorization code');
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new BadRequestException('Failed to fetch Google user profile');
    }

    const profile = (await profileResponse.json()) as GoogleUserInfo;
    if (!profile.email) {
      throw new BadRequestException('Google account did not provide an email address');
    }

    const user = await this.resolveGoogleUser(profile);
    await this.userRepository.updateLastLogin(user.id!);
    return this.authTokenService.issueTokenPair(user.id!);
  }

  private verifyState(state: string) {
    try {
      const payload = this.jwtService.verify<{ purpose?: string }>(state);
      if (payload.purpose !== 'google_oauth') {
        throw new Error('invalid purpose');
      }
    } catch {
      throw new BadRequestException('Invalid OAuth state parameter');
    }
  }

  private async resolveGoogleUser(profile: GoogleUserInfo) {
    const linked = await this.authMethods.findByProvider(
      AuthenticationMethodType.GOOGLE,
      profile.sub,
    );

    if (linked) {
      const user = await this.userRepository.findById(linked.identityId);
      if (!user?.id) throw new NotFoundException('Linked user not found');
      return user;
    }

    let user = await this.userRepository.findByEmail(profile.email!);
    if (!user?.id) {
      user = await this.userRepository.create({
        email: profile.email!,
        fullName: profile.name ?? profile.email!,
        emailVerified: profile.email_verified ?? true,
        status: IdentityStatus.ACTIVE,
      });
    } else if (profile.email_verified && !user.emailVerified) {
      user = await this.userRepository.update(user.id, { emailVerified: true });
    }

    await this.authMethods.ensureProvider(
      user.id!,
      AuthenticationMethodType.GOOGLE,
      profile.sub,
      { identifier: profile.email!.toLowerCase() },
    );

    if (user.passwordHash) {
      await this.authMethods.ensurePassword(user.id!, profile.email!);
    }

    return user;
  }
}
