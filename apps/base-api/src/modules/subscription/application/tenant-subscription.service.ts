import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../tenant/domain/tenant.repository.interface.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  APPLICATION_REPOSITORY,
  SUBSCRIPTION_PLAN_REPOSITORY,
  SUBSCRIPTION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type IApplicationRepository,
  type ISubscriptionPlanRepository,
  type ISubscriptionRepository,
  type ITenantEntitlementRepository,
} from '../domain/subscription.repository.interface.js';
import {
  AuditAction,
  EntitlementStatus,
  SubscriptionStatus,
  type SubscriptionProps,
  type TenantEntitlementProps,
} from '../domain/subscription.types.js';
import { AuditService } from './audit.service.js';
import { EntitlementPolicyService } from './entitlement-policy.service.js';
import { TenantEntitlementService } from './tenant-entitlement.service.js';
import { CreateTenantSubscriptionDto } from './dto/request/subscription.request.dto.js';
import { toEntitlementResponse, toSubscriptionResponse } from './mappers/subscription.mapper.js';

@Injectable()
export class TenantSubscriptionService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly policy: EntitlementPolicyService,
    private readonly audit: AuditService,
    private readonly entitlementService: TenantEntitlementService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY) private readonly plans: ISubscriptionPlanRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: ISubscriptionRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY) private readonly entitlements: ITenantEntitlementRepository,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.subscriptions.findByTenant(tenantId, page, limit);
    return paginatedResponse(data.map(toSubscriptionResponse), total, page, limit);
  }

  async get(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const subscription = await this.subscriptions.findById(tenantId, id);
    if (!subscription) throw new NotFoundException(`Subscription '${id}' not found`);
    return toSubscriptionResponse(subscription);
  }

  async create(tenantId: string, dto: CreateTenantSubscriptionDto, actorUserId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) throw new NotFoundException(`Tenant '${tenantId}' not found`);

    const plan = await this.plans.findById(dto.planId);
    if (!plan) throw new NotFoundException(`Subscription plan '${dto.planId}' not found`);
    if (!plan.isActive) {
      throw new BadRequestException(`Plan '${plan.planCode}' is not active`);
    }
    this.assertDateRange(dto.startDate, dto.endDate);

    const subscriptionCode =
      dto.subscriptionCode ?? (await this.allocateCode(plan.planCode, tenant.tenantCode, dto.startDate));

    const created = await this.subscriptions.create({
      tenantId,
      planId: plan.id,
      subscriptionCode,
      status: SubscriptionStatus.ACTIVE,
      startDate: dto.startDate.slice(0, 10),
      endDate: dto.endDate?.slice(0, 10),
      createdBy: actorUserId,
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.SUBSCRIPTION_CREATED,
      entityType: 'subscription',
      entityId: created.id,
      newValue: { subscriptionCode: created.subscriptionCode, planCode: plan.planCode },
    });

    const applicationCodes = plan.limits?.applicationCodes ?? [];
    for (const applicationCode of applicationCodes) {
      await this.entitlementService.establish(
        tenantId,
        { applicationCode, subscriptionId: created.id },
        actorUserId,
      );
    }

    return toSubscriptionResponse(created);
  }

  async activate(tenantId: string, id: string, actorUserId: string) {
    const subscription = await this.require(tenantId, id);
    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Cancelled subscriptions cannot be reactivated');
    }
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already active');
    }
    const commercial = this.policy.isSubscriptionCommerciallyValid({
      ...subscription,
      status: SubscriptionStatus.ACTIVE,
    });
    if (!commercial.ok && commercial.reason === 'SUBSCRIPTION_EXPIRED') {
      throw new BadRequestException('Subscription end date has passed');
    }

    const updated = await this.subscriptions.update(tenantId, id, {
      status: SubscriptionStatus.ACTIVE,
    });
    const restored = await this.cascade(
      tenantId,
      id,
      [EntitlementStatus.SUSPENDED],
      EntitlementStatus.ACTIVE,
      actorUserId,
      AuditAction.ENTITLEMENT_ACTIVATED,
    );
    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.SUBSCRIPTION_ACTIVATED,
      entityType: 'subscription',
      entityId: id,
      oldValue: { status: subscription.status },
      newValue: { status: updated.status },
    });
    return this.changeResponse(tenantId, updated, restored, []);
  }

  async suspend(tenantId: string, id: string, actorUserId: string) {
    const subscription = await this.require(tenantId, id);
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(`Subscription is ${(subscription.status ?? SubscriptionStatus.ACTIVE).toLowerCase()}`);
    }
    const updated = await this.subscriptions.update(tenantId, id, {
      status: SubscriptionStatus.SUSPENDED,
    });
    const affected = await this.cascade(
      tenantId,
      id,
      [EntitlementStatus.ACTIVE],
      EntitlementStatus.SUSPENDED,
      actorUserId,
      AuditAction.ENTITLEMENT_SUSPENDED,
    );
    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.SUBSCRIPTION_SUSPENDED,
      entityType: 'subscription',
      entityId: id,
      oldValue: { status: subscription.status },
      newValue: { status: updated.status },
    });
    return this.changeResponse(
      tenantId,
      updated,
      affected,
      await this.codesFor(affected),
    );
  }

  async cancel(tenantId: string, id: string, actorUserId: string) {
    const subscription = await this.require(tenantId, id);
    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }
    const updated = await this.subscriptions.update(tenantId, id, {
      status: SubscriptionStatus.CANCELLED,
      endDate: toDateOnly(new Date()),
    });
    const affected = await this.cascade(
      tenantId,
      id,
      [EntitlementStatus.ACTIVE, EntitlementStatus.SUSPENDED],
      EntitlementStatus.REMOVED,
      actorUserId,
      AuditAction.ENTITLEMENT_REMOVED,
    );
    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.SUBSCRIPTION_CANCELLED,
      entityType: 'subscription',
      entityId: id,
      oldValue: { status: subscription.status },
      newValue: { status: updated.status },
    });
    return this.changeResponse(tenantId, updated, affected, await this.codesFor(affected));
  }

  private async cascade(
    tenantId: string,
    subscriptionId: string,
    fromStatuses: EntitlementStatus[],
    toStatus: EntitlementStatus,
    actorUserId: string,
    action: AuditAction,
  ): Promise<TenantEntitlementProps[]> {
    const linked = await this.entitlements.findBySubscription(subscriptionId);
    const affected: TenantEntitlementProps[] = [];
    for (const entitlement of linked) {
      if (!fromStatuses.includes(entitlement.status ?? EntitlementStatus.ACTIVE)) continue;
      const updated = await this.entitlements.update(tenantId, entitlement.id!, {
        status: toStatus,
        ...(toStatus === EntitlementStatus.REMOVED ? { effectiveUntil: new Date() } : {}),
      });
      await this.audit.record({
        tenantId,
        actorUserId,
        action,
        entityType: 'tenant_entitlement',
        entityId: entitlement.id,
        oldValue: { status: entitlement.status },
        newValue: { status: updated.status, source: 'subscription_lifecycle' },
      });
      affected.push(updated);
    }
    return affected;
  }

  private async changeResponse(
    tenantId: string,
    subscription: SubscriptionProps,
    affected: TenantEntitlementProps[],
    unavailable: string[],
  ) {
    const apps = await this.applications.findByIds(affected.map((row) => row.applicationId));
    const appMap = new Map(apps.map((app) => [app.id!, app]));
    return {
      subscription: toSubscriptionResponse(subscription),
      affectedEntitlements: affected.map((row) => toEntitlementResponse(row, appMap.get(row.applicationId))),
      reconciliation: await this.policy.buildReconciliation(tenantId, unavailable),
    };
  }

  private async codesFor(rows: TenantEntitlementProps[]) {
    const apps = await this.applications.findByIds(rows.map((row) => row.applicationId));
    return apps.map((app) => app.applicationCode);
  }

  private async require(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const subscription = await this.subscriptions.findById(tenantId, id);
    if (!subscription) throw new NotFoundException(`Subscription '${id}' not found`);
    return subscription;
  }

  private assertDateRange(startDate: string, endDate?: string) {
    const start = startDate.slice(0, 10);
    const end = endDate?.slice(0, 10);
    if (end && end < start) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
  }

  private async allocateCode(planCode: string, tenantCode: string, startDate: string) {
    const base = `${planCode}-${tenantCode}-${startDate.replaceAll('-', '')}`.slice(0, 100);
    if (!(await this.subscriptions.findByCode(base))) return base;
    const fallback = `${base}-${Date.now()}`.slice(0, 100);
    return fallback;
  }
}

function toDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
