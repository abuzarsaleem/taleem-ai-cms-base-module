import { Module } from '@nestjs/common';
import { EMAIL_SERVICE } from './domain/email.service.interface.js';
import { BrevoEmailService } from './application/brevo-email.service.js';

@Module({
  providers: [
    BrevoEmailService,
    {
      provide: EMAIL_SERVICE,
      useExisting: BrevoEmailService,
    },
  ],
  exports: [EMAIL_SERVICE, BrevoEmailService],
})
export class NotificationModule {}
