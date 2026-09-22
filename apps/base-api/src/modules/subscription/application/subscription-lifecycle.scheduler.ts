import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service.js';

@Injectable()
export class SubscriptionLifecycleScheduler {
  private readonly logger = new Logger(SubscriptionLifecycleScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly lifecycle: SubscriptionLifecycleService,
  ) {}

  /** Daily at 01:00 server time — expiry warnings + auto-inactivate ended subscriptions */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyLifecycle() {
    if (this.config.get<boolean>('subscription.lifecycleJobsEnabled') === false) {
      this.logger.debug('Subscription lifecycle jobs disabled');
      return;
    }
    this.logger.log('Starting subscription lifecycle job');
    await this.lifecycle.runDaily();
  }
}
