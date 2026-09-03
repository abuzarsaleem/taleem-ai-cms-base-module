import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import { UserStatus } from '../../user/domain/user.types.js';
import { LoginDto } from './dto/auth.dto.js';
import { AuthTokenService } from './auth-token.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const requireVerification = this.configService.get<boolean>(
      'auth.requireEmailVerification',
      false,
    );
    if (requireVerification && !user.emailVerified) {
      throw new UnauthorizedException('Email address is not verified');
    }

    await this.userRepository.updateLastLogin(user.id!);
    return this.authTokenService.issueTokenPair(user.id!);
  }

  issueTokensForUser(userId: string) {
    return this.authTokenService.issueTokenPair(userId);
  }

  refresh(refreshToken: string) {
    return this.authTokenService.refresh(refreshToken);
  }

  logout(refreshToken: string) {
    return this.authTokenService.logout(refreshToken);
  }
}
