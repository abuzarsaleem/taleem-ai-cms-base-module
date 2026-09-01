import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IEmailService } from '../../notification/domain/email.service.interface.js';

@Injectable()
export class InvitationEmailService {
  constructor(private readonly config: ConfigService) {}

  async sendInvitation(
    emailService: IEmailService,
    params: {
      to: string;
      tenantName: string;
      invitationToken: string;
      expiresAt: Date;
    },
  ): Promise<void> {
    const acceptUrlBase = this.config.get<string>(
      'invitation.acceptUrlBase',
      'http://localhost:3000/accept-invite',
    );
    const acceptUrl = `${acceptUrlBase.replace(/\/$/, '')}?token=${encodeURIComponent(params.invitationToken)}`;
    const sender = emailService.getDefaultSender();

    await emailService.send({
      to: params.to,
      subject: `You've been invited to administer ${params.tenantName}`,
      tags: ['tenant-admin-invitation'],
      html: `
        <p>Hello,</p>
        <p>You have been invited to become a tenant administrator for <strong>${params.tenantName}</strong> on Taleem AI.</p>
        <p><a href="${acceptUrl}">Accept invitation and set your password</a></p>
        <p>This invitation expires on ${params.expiresAt.toUTCString()}.</p>
        <p>If you did not expect this email, you can ignore it.</p>
        <p>— ${sender.name}</p>
      `.trim(),
      text: [
        `You have been invited to administer ${params.tenantName} on Taleem AI.`,
        `Accept your invitation: ${acceptUrl}`,
        `Expires: ${params.expiresAt.toUTCString()}`,
      ].join('\n\n'),
    });
  }
}
