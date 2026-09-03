import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { UserStatus } from '../../user/domain/user.types.js';
import { RbacService } from '../../rbac/application/rbac.service.js';
import {
  FILE_STORAGE,
  type IFileStorageService,
} from '../../storage/domain/storage.service.interface.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../../invitation/domain/invitation.repository.interface.js';
import { MembershipStatus } from '../../invitation/domain/membership.types.js';
import { USER_TOKEN_REPOSITORY } from '../domain/user-token.repository.interface.js';
import type { IUserTokenRepository } from '../domain/user-token.repository.interface.js';
import { UserTokenType } from '../domain/user-token.types.js';
import { generateToken, hashToken } from './token.util.js';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(USER_TOKEN_REPOSITORY) private readonly tokenRepository: IUserTokenRepository,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorageService,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: ITenantMembershipRepository,
  ) {}

  async issueTokenPair(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user?.id || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const access = await this.rbacService.getUserAccess(userId);
    const { data: memberships } = await this.membershipRepository.findByUser(userId, 1, 100);
    const tenantRoles = [
      ...new Set(
        memberships
          .filter((m) => m.membershipStatus === MembershipStatus.ACTIVE)
          .map((m) => m.role)
          .filter(Boolean),
      ),
    ];
    const roles = [...new Set([...access.roles, ...tenantRoles])].sort();

    const payload = { sub: userId, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const { raw, hash } = generateToken();
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresAt = this.resolveRefreshExpiry(refreshExpiresIn);

    await this.tokenRepository.create({
      userId,
      tokenType: UserTokenType.REFRESH_TOKEN,
      tokenHash: hash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: raw,
      tokenType: 'Bearer' as const,
      expiresIn: this.config.get<string>('jwt.accessExpiresIn', '15m'),
      refreshExpiresIn,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified ?? false,
        avatarUrl: user.avatarUrl ? await this.storage.resolveUrl(user.avatarUrl) : undefined,
        roles,
      },
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.tokenRepository.findValidByHash(
      tokenHash,
      UserTokenType.REFRESH_TOKEN,
    );
    if (!stored?.id) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.tokenRepository.revoke(stored.id);
    return this.issueTokenPair(stored.userId!);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.tokenRepository.findValidByHash(
      tokenHash,
      UserTokenType.REFRESH_TOKEN,
    );
    if (stored?.id) {
      await this.tokenRepository.revoke(stored.id);
    }
    return { loggedOut: true };
  }

  async logoutAll(userId: string) {
    await this.tokenRepository.revokeAllForUser(userId, UserTokenType.REFRESH_TOKEN);
    return { loggedOut: true };
  }

  private resolveRefreshExpiry(duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration.trim());
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return new Date(Date.now() + value * (multipliers[unit] ?? 86_400_000));
  }
}
