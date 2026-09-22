import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { IEmailService } from '../../notification/domain/email.service.interface.js';
import { EMAIL_SERVICE } from '../../notification/domain/email.service.interface.js';

@Injectable()
export class SubscriptionEmailService {
  constructor(@Inject(EMAIL_SERVICE) private readonly email: IEmailService) {}

  async sendExpiryWarning(params: {
    to: string[];
    tenantName: string;
    subscriptionCode: string;
    endDate: string;
    daysRemaining: number;
    applicationCodes: string[];
  }): Promise<void> {
    if (!params.to.length) return;
    const sender = this.email.getDefaultSender();
    const apps = params.applicationCodes.join(', ') || 'N/A';
    const dayLabel = params.daysRemaining === 1 ? '1 day' : `${params.daysRemaining} days`;

    await this.email.send({
      to: params.to,
      subject: `Subscription expiring in ${dayLabel}: ${params.subscriptionCode}`,
      tags: ['subscription-expiry-warning'],
      html: `
        <p>Hello,</p>
        <p>The subscription <strong>${params.subscriptionCode}</strong> for
        <strong>${params.tenantName}</strong> will expire in <strong>${dayLabel}</strong>
        (end date: ${params.endDate}).</p>
        <p>Applications covered: ${apps}</p>
        <p>Please renew or extend the subscription to avoid service interruption.</p>
        <p>— ${sender.name}</p>
      `.trim(),
      text: [
        `Subscription ${params.subscriptionCode} for ${params.tenantName} expires in ${dayLabel} (${params.endDate}).`,
        `Applications: ${apps}`,
        'Please renew or extend the subscription to avoid service interruption.',
      ].join('\n\n'),
    });
  }

  async sendExpiredNotice(params: {
    to: string[];
    tenantName: string;
    subscriptionCode: string;
    endDate: string;
    applicationCodes: string[];
  }): Promise<void> {
    if (!params.to.length) return;
    const sender = this.email.getDefaultSender();
    const apps = params.applicationCodes.join(', ') || 'N/A';

    await this.email.send({
      to: params.to,
      subject: `Subscription expired: ${params.subscriptionCode}`,
      tags: ['subscription-expired'],
      html: `
        <p>Hello,</p>
        <p>The subscription <strong>${params.subscriptionCode}</strong> for
        <strong>${params.tenantName}</strong> expired on <strong>${params.endDate}</strong>
        and has been marked inactive.</p>
        <p>Applications covered: ${apps}</p>
        <p>Linked entitlements have been deactivated. Create or renew a subscription to restore access.</p>
        <p>— ${sender.name}</p>
      `.trim(),
      text: [
        `Subscription ${params.subscriptionCode} for ${params.tenantName} expired on ${params.endDate} and is now inactive.`,
        `Applications: ${apps}`,
        'Linked entitlements have been deactivated. Create or renew a subscription to restore access.',
      ].join('\n\n'),
    });
  }
}
