import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  SUBSCRIPTION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type IApplicationRepository,
  type ISubscriptionRepository,
  type ITenantEntitlementRepository,
} from '../domain/subscription.repository.interface.js';
import {
  ApplicationStatus,
  EntitlementStatus,
  SubscriptionStatus,
  type AccessDeniedReason,
  type ApplicationProps,
  type SubscriptionProps,
  type TenantEntitlementProps,
} from '../domain/subscription.types.js';
import { toDateOnly } from './date.util.js';
import type {
  ApplicationAccessResponseDto,
  AvailableApplicationResponseDto,
} from './dto/response/subscription.response.dto.js';
import { toEntitlementResponse } from './mappers/subscription.mapper.js';

type Denial = { ok: false; reason: AccessDeniedReason };
type Allowance = { ok: true };

@Injectable()
export class EntitlementPolicyService {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: ISubscriptionRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY) private readonly entitlements: ITenantEntitlementRepository,
  ) {}

  assertApplicationEligible(application: ApplicationProps): void {
    if (application.status !== ApplicationStatus.ACTIVE) {
      throw new BadRequestException(
        `Application '${application.applicationCode}' is inactive and cannot be entitled`,
      );
    }
  }

  isSubscriptionCommerciallyValid(subscription: SubscriptionProps, at = new Date()): Allowance | Denial {
    if (subscription.status === SubscriptionStatus.INACTIVE) {
      return { ok: false, reason: 'SUBSCRIPTION_INACTIVE' };
    }
    const today = toDateOnly(at);
    if (subscription.startDate > today) {
      return { ok: false, reason: 'SUBSCRIPTION_INACTIVE' };
    }
    if (subscription.endDate && subscription.endDate < today) {
      return { ok: false, reason: 'SUBSCRIPTION_ENDED' };
    }
    return { ok: true };
  }

  hasPeriodEnded(subscription: SubscriptionProps, at = new Date()): boolean {
    return Boolean(subscription.endDate && subscription.endDate < toDateOnly(at));
  }

  evaluateEntitlement(
    entitlement: TenantEntitlementProps,
    application: ApplicationProps,
    subscription: SubscriptionProps | null,
    at = new Date(),
  ): Allowance | Denial {
    if (application.status !== ApplicationStatus.ACTIVE) {
      return { ok: false, reason: 'APPLICATION_INACTIVE' };
    }
    if (entitlement.status !== EntitlementStatus.ACTIVE) {
      return { ok: false, reason: 'ENTITLEMENT_INACTIVE' };
    }
    if (entitlement.effectiveFrom && entitlement.effectiveFrom > at) {
      return { ok: false, reason: 'ENTITLEMENT_NOT_YET_EFFECTIVE' };
    }
    if (entitlement.effectiveUntil && entitlement.effectiveUntil <= at) {
      return { ok: false, reason: 'ENTITLEMENT_INACTIVE' };
    }
    if (entitlement.subscriptionId) {
      if (!subscription) {
        return { ok: false, reason: 'SUBSCRIPTION_INACTIVE' };
      }
      const commercial = this.isSubscriptionCommerciallyValid(subscription, at);
      if (!commercial.ok) return commercial;
    }
    return { ok: true };
  }

  async assertSubscriptionAllowsApplication(
    tenantId: string,
    subscriptionId: string,
    applicationCode: string,
  ): Promise<SubscriptionProps> {
    const subscription = await this.subscriptions.findById(tenantId, subscriptionId);
    if (!subscription) {
      throw new NotFoundException(`Subscription '${subscriptionId}' not found`);
    }
    const commercial = this.isSubscriptionCommerciallyValid(subscription);
    if (!commercial.ok) {
      throw new BadRequestException(
        commercial.reason === 'SUBSCRIPTION_ENDED'
          ? 'This subscription period has ended; create a new subscription'
          : 'Requested entitlement conflicts with the tenant subscription state',
      );
    }
    const allowed = subscription.applicationCodes ?? [];
    if (!allowed.includes(applicationCode)) {
      throw new BadRequestException(
        `Application '${applicationCode}' is not included in this subscription`,
      );
    }
    return subscription;
  }

  async evaluateAccess(tenantId: string, applicationCode: string): Promise<ApplicationAccessResponseDto> {
    const application = await this.applications.findByCode(applicationCode);
    if (!application?.id) {
      return { applicationCode, entitled: false, reason: 'APPLICATION_NOT_FOUND' };
    }
    if (application.status !== ApplicationStatus.ACTIVE) {
      return { applicationCode, entitled: false, reason: 'APPLICATION_INACTIVE' };
    }

    const entitlement = await this.entitlements.findByTenantAndApplication(tenantId, application.id);
    if (!entitlement) {
      return { applicationCode, entitled: false, reason: 'ENTITLEMENT_NOT_FOUND' };
    }

    const subscription = entitlement.subscriptionId
      ? (await this.subscriptions.findById(tenantId, entitlement.subscriptionId))
      : null;

    const result = this.evaluateEntitlement(entitlement, application, subscription);
    if (!result.ok) {
      return {
        applicationCode,
        entitled: false,
        reason: result.reason,
        entitlement: toEntitlementResponse(entitlement, application),
      };
    }

    return {
      applicationCode,
      entitled: true,
      entitlement: toEntitlementResponse(entitlement, application),
    };
  }

  async listAvailable(tenantId: string): Promise<AvailableApplicationResponseDto[]> {
    const entitlements = await this.entitlements.findAllByTenant(tenantId);
    const applicationIds = [...new Set(entitlements.map((row) => row.applicationId))];
    const subscriptionIds = [
      ...new Set(entitlements.map((row) => row.subscriptionId).filter((id): id is string => Boolean(id))),
    ];
    const applications = new Map(
      (await this.applications.findByIds(applicationIds)).map((app) => [app.id!, app]),
    );
    const subscriptions = new Map(
      (await this.subscriptions.findByIds(subscriptionIds)).map((sub) => [sub.id!, sub]),
    );

    const available: AvailableApplicationResponseDto[] = [];
    for (const entitlement of entitlements) {
      const application = applications.get(entitlement.applicationId);
      if (!application) continue;
      const subscription = entitlement.subscriptionId
        ? subscriptions.get(entitlement.subscriptionId) ?? null
        : null;
      if (!this.evaluateEntitlement(entitlement, application, subscription).ok) continue;
      available.push({
        applicationId: application.id!,
        applicationCode: application.applicationCode,
        name: application.name,
        launchUrl: application.launchUrl,
        entitlementId: entitlement.id!,
        effectiveFrom: entitlement.effectiveFrom!,
        effectiveUntil: entitlement.effectiveUntil,
        subscriptionId: entitlement.subscriptionId,
      });
    }
    return available;
  }
}
