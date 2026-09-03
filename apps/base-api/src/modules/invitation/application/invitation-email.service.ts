import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IEmailService } from '../../notification/domain/email.service.interface.js';
import { MembershipRole } from '../domain/membership.types.js';

@Injectable()
export class InvitationEmailService {
  constructor(private readonly config: ConfigService) {}

  /** Single accept link for admin and member invitations */
  async sendInvitation(
    emailService: IEmailService,
    params: {
      to: string;
      tenantName: string;
      invitationToken: string;
      expiresAt: Date;
      role: MembershipRole;
    },
  ): Promise<void> {
    const acceptUrlBase = this.config.get<string>(
      'invitation.acceptUrlBase',
      'http://localhost:3000/accept-invite',
    );
    const acceptUrl = `${acceptUrlBase.replace(/\/$/, '')}?token=${encodeURIComponent(params.invitationToken)}`;
    const sender = emailService.getDefaultSender();
    const roleLabel =
      params.role === MembershipRole.ADMIN ? 'tenant administrator' : 'tenant member';

    await emailService.send({
      to: params.to,
      subject: `You've been invited to join ${params.tenantName}`,
      tags: ['tenant-invitation'],
      html: `
        <p>Hello,</p>
        <p>You have been invited to join <strong>${params.tenantName}</strong> on Taleem AI as a ${roleLabel}.</p>
        <p><a href="${acceptUrl}">Accept invitation</a></p>
        <p>This invitation expires on ${params.expiresAt.toUTCString()}.</p>
        <p>If you did not expect this email, you can ignore it.</p>
        <p>— ${sender.name}</p>
      `.trim(),
      text: [
        `You have been invited to join ${params.tenantName} on Taleem AI as a ${roleLabel}.`,
        `Accept your invitation: ${acceptUrl}`,
        `Expires: ${params.expiresAt.toUTCString()}`,
      ].join('\n\n'),
    });
  }

  async sendAdminInvitation(
    emailService: IEmailService,
    params: {
      to: string;
      tenantName: string;
      invitationToken: string;
      expiresAt: Date;
    },
  ): Promise<void> {
    return this.sendInvitation(emailService, { ...params, role: MembershipRole.ADMIN });
  }

  async sendMemberInvitation(
    emailService: IEmailService,
    params: {
      to: string;
      tenantName: string;
      invitationToken: string;
      expiresAt: Date;
    },
  ): Promise<void> {
    return this.sendInvitation(emailService, { ...params, role: MembershipRole.MEMBER });
  }
}
