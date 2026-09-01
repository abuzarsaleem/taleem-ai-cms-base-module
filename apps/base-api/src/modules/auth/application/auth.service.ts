import { Inject, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import { UserStatus } from '../../user/domain/user.types.js';
import { RbacService } from '../../rbac/application/rbac.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const saltRounds = this.configService.get<number>('auth.bcryptSaltRounds', 12);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      status: UserStatus.ACTIVE,
    });

    return this.issueTokens(user.id!, user.email, user.fullName);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id!, user.email, user.fullName);
  }

  async issueTokensForUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user?.id || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }
    return this.issueTokens(user.id, user.email, user.fullName);
  }

  private async issueTokens(userId: string, email: string, fullName: string) {
    const access = await this.rbacService.getUserAccess(userId);
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '15m'),
      user: {
        id: userId,
        email,
        fullName,
        roles: access.roles,
        permissions: access.permissions,
      },
    };
  }
}
