export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: string[];
}

export interface EmailSenderProfile {
  name: string;
  email: string;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

export interface IEmailService {
  send(options: SendEmailOptions): Promise<void>;
  getDefaultSender(): EmailSenderProfile;
}
