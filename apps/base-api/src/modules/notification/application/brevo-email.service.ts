import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  EmailSenderProfile,
  IEmailService,
  SendEmailOptions,
} from '../domain/email.service.interface.js';
import { parseEmailSender } from './email-sender.parser.js';

interface BrevoSendResponse {
  messageId?: string;
}

@Injectable()
export class BrevoEmailService implements IEmailService {
  private readonly logger = new Logger(BrevoEmailService.name);
  private readonly apiKey: string;
  private readonly sender: EmailSenderProfile;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('brevo.apiKey', '');
    this.sender = parseEmailSender(
      this.configService.get<string>('brevo.fromEmail', 'Taleem AI <noreply@taleem.ai>'),
    );
    this.enabled = Boolean(this.apiKey);
  }

  getDefaultSender(): EmailSenderProfile {
    return this.sender;
  }

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Brevo API key not configured — email not sent');
      return;
    }

    const recipients = (Array.isArray(options.to) ? options.to : [options.to]).map((email) => ({
      email,
    }));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: this.sender,
        to: recipients,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        tags: options.tags,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Brevo send failed (${response.status}): ${errorBody}`);
      throw new Error(`Failed to send email via Brevo (${response.status})`);
    }

    const result = (await response.json()) as BrevoSendResponse;
    this.logger.log(`Email sent to ${recipients.map((r) => r.email).join(', ')} — id ${result.messageId ?? 'n/a'}`);
  }
}
