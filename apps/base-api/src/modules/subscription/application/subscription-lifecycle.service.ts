import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import {
  TENANT_REPOSITORY,
  type ITenantRepository,
} from '../../tenant/domain/tenant.repository.interface.js';
import { MembershipRole, MembershipStatus } from '../../invitation/domain/membership.types.js';
import {
  SUBSCRIPTION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type ISubscriptionRepository,
  type ITenantEntitlementRepository,
} from '../domain/subscription.repository.interface.js';
import {
  AuditAction,
  EntitlementStatus,
  SubscriptionStatus,
  type SubscriptionProps,
} from '../domain/subscription.types.js';
import {
  SubscriptionLifecycleEventEntity,
  SubscriptionLifecycleEventType,
} from '../infrastructure/persistence/subscription-lifecycle.entity.js';
import { AuditService } from './audit.service.js';
import { SubscriptionEmailService } from './subscription-email.service.js';
import { toDateOnly } from './date.util.js';

export type SubscriptionLifecycleRunResult = {
  warningsSent: number;
  expired: number;
  skipped: number;
  errors: string[];
};

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly emails: SubscriptionEmailService,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: ISubscriptionRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY)
    private readonly entitlements: ITenantEntitlementRepository,
    @Inject(TENANT_REPOSITORY)
    private readonly tenants: ITenantRepository,
    @InjectRepository(SubscriptionLifecycleEventEntity)
    private readonly lifecycleEvents: Repository<SubscriptionLifecycleEventEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async runDaily(): Promise<SubscriptionLifecycleRunResult> {
    const today = toDateOnly(new Date());
    const result: SubscriptionLifecycleRunResult = {
      warningsSent: 0,
      expired: 0,
      skipped: 0,
      errors: [],
    };

    const warningDays = this.config.get<number[]>('subscription.expiryWarningDays') ?? [
      30, 14, 7, 3, 1,
    ];

    for (const days of warningDays) {
      try {
        const targetDate = this.addDays(today, days);
        const rows = await this.subscriptions.findActiveEndingOn(targetDate);
        for (const subscription of rows) {
          try {
            const sent = await this.sendWarningIfNeeded(subscription, days, today);
            if (sent) result.warningsSent += 1;
            else result.skipped += 1;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            result.errors.push(`warning ${subscription.id}: ${message}`);
            this.logger.error(`Expiry warning failed for ${subscription.id}: ${message}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`warning-days ${days}: ${message}`);
      }
    }

    try {
      const expiredRows = await this.subscriptions.findActiveEndedOnOrBefore(today);
      for (const subscription of expiredRows) {
        try {
          const didExpire = await this.expireIfNeeded(subscription, today);
          if (didExpire) result.expired += 1;
          else result.skipped += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push(`expire ${subscription.id}: ${message}`);
          this.logger.error(`Expiry failed for ${subscription.id}: ${message}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`expire-batch: ${message}`);
    }

    this.logger.log(
      `Lifecycle run complete: warnings=${result.warningsSent} expired=${result.expired} skipped=${result.skipped} errors=${result.errors.length}`,
    );
    return result;
  }

  private async sendWarningIfNeeded(
    subscription: SubscriptionProps,
    daysBefore: number,
    asOf: string,
  ): Promise<boolean> {
    if (!subscription.id || !subscription.endDate) return false;

    const already = await this.lifecycleEvents.findOne({
      where: {
        subscriptionId: subscription.id,
        eventType: SubscriptionLifecycleEventType.EXPIRY_WARNING,
        daysBefore,
      },
    });
    if (already) return false;

    const tenant = await this.tenants.findById(subscription.tenantId);
    const recipients = await this.findTenantAdminEmails(subscription.tenantId);

    await this.emails.sendExpiryWarning({
      to: recipients,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? subscription.tenantId,
      subscriptionCode: subscription.subscriptionCode,
      endDate: subscription.endDate,
      daysRemaining: daysBefore,
      applicationCodes: subscription.applicationCodes ?? [],
    });

    await this.lifecycleEvents.save(
      this.lifecycleEvents.create({
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        eventType: SubscriptionLifecycleEventType.EXPIRY_WARNING,
        daysBefore,
        metadata: {
          asOf,
          endDate: subscription.endDate,
          recipientCount: recipients.length,
        },
      }),
    );

    await this.audit.record({
      tenantId: subscription.tenantId,
      action: AuditAction.SUBSCRIPTION_EXPIRY_WARNING,
      entityType: 'subscription',
      entityId: subscription.id,
      newValue: {
        subscriptionCode: subscription.subscriptionCode,
        endDate: subscription.endDate,
        daysRemaining: daysBefore,
        recipientCount: recipients.length,
        source: 'subscription-lifecycle-job',
      },
    });

    return true;
  }

  private async expireIfNeeded(subscription: SubscriptionProps, asOf: string): Promise<boolean> {
    if (!subscription.id || !subscription.endDate) return false;

    const already = await this.lifecycleEvents.findOne({
      where: {
        subscriptionId: subscription.id,
        eventType: SubscriptionLifecycleEventType.EXPIRED,
      },
    });
    if (already) return false;

    const before = this.snapshot(subscription);
    const updated = await this.subscriptions.update(subscription.tenantId, subscription.id, {
      status: SubscriptionStatus.INACTIVE,
    });

    const linked = await this.entitlements.findBySubscription(subscription.id);
    const inactivatedEntitlementIds: string[] = [];
    for (const row of linked) {
      if (row.status === EntitlementStatus.INACTIVE || !row.id) continue;
      await this.entitlements.update(subscription.tenantId, row.id, {
        status: EntitlementStatus.INACTIVE,
      });
      inactivatedEntitlementIds.push(row.id);
      await this.audit.record({
        tenantId: subscription.tenantId,
        action: AuditAction.ENTITLEMENT_UPDATED,
        entityType: 'tenant_entitlement',
        entityId: row.id,
        oldValue: { status: row.status },
        newValue: {
          status: EntitlementStatus.INACTIVE,
          reason: 'subscription_expired',
          subscriptionId: subscription.id,
        },
      });
    }

    await this.lifecycleEvents.save(
      this.lifecycleEvents.create({
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        eventType: SubscriptionLifecycleEventType.EXPIRED,
        daysBefore: null,
        metadata: {
          asOf,
          endDate: subscription.endDate,
          inactivatedEntitlementIds,
        },
      }),
    );

    await this.audit.record({
      tenantId: subscription.tenantId,
      action: AuditAction.SUBSCRIPTION_EXPIRED,
      entityType: 'subscription',
      entityId: subscription.id,
      oldValue: before,
      newValue: {
        ...this.snapshot(updated),
        inactivatedEntitlementIds,
        source: 'subscription-lifecycle-job',
      },
    });

    const tenant = await this.tenants.findById(subscription.tenantId);
    const recipients = await this.findTenantAdminEmails(subscription.tenantId);
    await this.emails.sendExpiredNotice({
      to: recipients,
      tenantName: tenant?.displayName ?? tenant?.legalName ?? subscription.tenantId,
      subscriptionCode: subscription.subscriptionCode,
      endDate: subscription.endDate,
      applicationCodes: subscription.applicationCodes ?? [],
    });

    return true;
  }

  private async findTenantAdminEmails(tenantId: string): Promise<string[]> {
    const rows = await this.dataSource.query(
      `
      SELECT DISTINCT lower(em.identifier_value) AS email
      FROM "${DATABASE_SCHEMA}".tenant_memberships m
      INNER JOIN "${DATABASE_SCHEMA}".identity_identifiers em
        ON em.identity_id = m.identity_id
       AND em.identifier_type = 'EMAIL'
       AND em.is_primary = TRUE
      WHERE m.tenant_id = $1
        AND m.status = $2
        AND m.role = $3
        AND em.identifier_value IS NOT NULL
        AND em.identifier_value <> ''
      `,
      [tenantId, MembershipStatus.ACTIVE, MembershipRole.ADMIN],
    );
    return rows
      .map((row: { email?: string }) => row.email?.trim())
      .filter((email: string | undefined): email is string => Boolean(email));
  }

  private snapshot(subscription: SubscriptionProps): Record<string, unknown> {
    return {
      subscriptionCode: subscription.subscriptionCode,
      status: subscription.status,
      planType: subscription.planType,
      billingCycle: subscription.billingCycle,
      applicationCodes: subscription.applicationCodes,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    };
  }

  private addDays(dateOnly: string, days: number): string {
    const date = new Date(`${dateOnly}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return toDateOnly(date);
  }
}
