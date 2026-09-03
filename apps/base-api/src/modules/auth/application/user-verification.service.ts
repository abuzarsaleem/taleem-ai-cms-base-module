import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EMAIL_SERVICE, type IEmailService } from '../../notification/domain/email.service.interface.js';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { VERIFICATION_TOKEN_REPOSITORY } from '../domain/verification.repository.interface.js';
import type { IVerificationTokenRepository } from '../domain/verification.repository.interface.js';
import { VerificationTokenType } from '../domain/verification.types.js';
import { AuthEmailService } from './auth-email.service.js';
import {
  generateVerificationToken,
  hashVerificationToken,
} from './verification-token.util.js';

@Injectable()
export class UserVerificationService {
  constructor(
    private readonly config: ConfigService,
    private readonly authEmail: AuthEmailService,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async sendEmailVerification(userId: string, ipAddress?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user?.id) {
      throw new BadRequestException('User not found');
    }
    if (user.emailVerified) {
      return { sent: false, message: 'Email is already verified' };
    }

    await this.issueEmailVerification(user.id, user.email, user.fullName, ipAddress);
    return { sent: true, message: 'Verification email sent' };
  }

  async issueEmailVerificationForUser(userId: string, ipAddress?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user?.id || user.emailVerified) {
      return;
    }
    await this.issueEmailVerification(user.id, user.email, user.fullName, ipAddress);
  }

  async verifyEmail(token: string) {
    const tokenHash = hashVerificationToken(token);
    const stored = await this.tokenRepository.findValidByHash(
      tokenHash,
      VerificationTokenType.EMAIL_VERIFICATION,
    );
    if (!stored?.id) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepository.update(stored.userId, { emailVerified: true });
    await this.tokenRepository.markUsed(stored.id);

    return { verified: true, message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string, ipAddress?: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user?.id || !user.passwordHash) {
      return {
        sent: true,
        message: 'If an account exists for this email, a reset link has been sent',
      };
    }

    const ttlHours = this.config.get<number>('auth.passwordResetTokenTtlHours', 1);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const { raw, hash } = generateVerificationToken();

    await this.tokenRepository.invalidatePendingForUser(
      user.id,
      VerificationTokenType.PASSWORD_RESET,
    );
    await this.tokenRepository.create({
      userId: user.id,
      tokenType: VerificationTokenType.PASSWORD_RESET,
      tokenHash: hash,
      expiresAt,
      ipAddress,
    });

    await this.authEmail.sendPasswordReset(this.emailService, {
      to: user.email,
      fullName: user.fullName,
      token: raw,
      expiresAt,
    });

    return {
      sent: true,
      message: 'If an account exists for this email, a reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashVerificationToken(token);
    const stored = await this.tokenRepository.findValidByHash(
      tokenHash,
      VerificationTokenType.PASSWORD_RESET,
    );
    if (!stored?.id) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = this.config.get<number>('auth.bcryptSaltRounds', 12);
    await this.userRepository.update(stored.userId, {
      passwordHash: await bcrypt.hash(newPassword, saltRounds),
    });
    await this.tokenRepository.markUsed(stored.id);

    return { reset: true, message: 'Password reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findById(userId);
    if (!user?.passwordHash) {
      throw new BadRequestException('Password login is not enabled for this account');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const saltRounds = this.config.get<number>('auth.bcryptSaltRounds', 12);
    await this.userRepository.update(userId, {
      passwordHash: await bcrypt.hash(newPassword, saltRounds),
    });

    return { changed: true, message: 'Password changed successfully' };
  }

  private async issueEmailVerification(
    userId: string,
    email: string,
    fullName: string,
    ipAddress?: string,
  ) {
    const ttlHours = this.config.get<number>('auth.verificationTokenTtlHours', 24);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const { raw, hash } = generateVerificationToken();

    await this.tokenRepository.invalidatePendingForUser(
      userId,
      VerificationTokenType.EMAIL_VERIFICATION,
    );
    await this.tokenRepository.create({
      userId,
      tokenType: VerificationTokenType.EMAIL_VERIFICATION,
      tokenHash: hash,
      expiresAt,
      ipAddress,
    });

    await this.authEmail.sendEmailVerification(this.emailService, {
      to: email,
      fullName,
      token: raw,
      expiresAt,
    });
  }
}
