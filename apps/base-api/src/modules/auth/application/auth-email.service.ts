import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IEmailService } from '../../notification/domain/email.service.interface.js';

@Injectable()
export class AuthEmailService {
  constructor(private readonly config: ConfigService) {}

  async sendEmailVerification(
    emailService: IEmailService,
    params: { to: string; fullName: string; token: string; expiresAt: Date },
  ): Promise<void> {
    const urlBase = this.config.get<string>(
      'auth.emailVerificationUrlBase',
      'http://localhost:3000/verify-email',
    );
    const verifyUrl = `${urlBase.replace(/\/$/, '')}?token=${encodeURIComponent(params.token)}`;
    const sender = emailService.getDefaultSender();

    await emailService.send({
      to: params.to,
      subject: 'Verify your Taleem AI email address',
      tags: ['email-verification'],
      html: `
        <p>Hello ${params.fullName},</p>
        <p>Please verify your email address for Taleem AI.</p>
        <p><a href="${verifyUrl}">Verify email address</a></p>
        <p>This link expires on ${params.expiresAt.toUTCString()}.</p>
        <p>If you did not create an account, you can ignore this email.</p>
        <p>— ${sender.name}</p>
      `.trim(),
      text: [
        `Hello ${params.fullName},`,
        'Please verify your email address for Taleem AI.',
        `Verify: ${verifyUrl}`,
        `Expires: ${params.expiresAt.toUTCString()}`,
      ].join('\n\n'),
    });
  }

  async sendPasswordReset(
    emailService: IEmailService,
    params: { to: string; fullName: string; token: string; expiresAt: Date },
  ): Promise<void> {
    const urlBase = this.config.get<string>(
      'auth.passwordResetUrlBase',
      'http://localhost:3000/reset-password',
    );
    const resetUrl = `${urlBase.replace(/\/$/, '')}?token=${encodeURIComponent(params.token)}`;
    const sender = emailService.getDefaultSender();

    await emailService.send({
      to: params.to,
      subject: 'Reset your Taleem AI password',
      tags: ['password-reset'],
      html: `
        <p>Hello ${params.fullName},</p>
        <p>We received a request to reset your Taleem AI password.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This link expires on ${params.expiresAt.toUTCString()}.</p>
        <p>If you did not request a reset, you can ignore this email.</p>
        <p>— ${sender.name}</p>
      `.trim(),
      text: [
        `Hello ${params.fullName},`,
        'We received a request to reset your Taleem AI password.',
        `Reset: ${resetUrl}`,
        `Expires: ${params.expiresAt.toUTCString()}`,
      ].join('\n\n'),
    });
  }
}
