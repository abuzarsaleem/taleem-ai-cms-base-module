import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import { TENANT_REPOSITORY, type ITenantRepository } from '../../tenant/domain/tenant.repository.interface.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  APPLICATION_REPOSITORY,
  SUBSCRIPTION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type IApplicationRepository,
  type ISubscriptionRepository,
  type ITenantEntitlementRepository,
} from '../domain/subscription.repository.interface.js';
import {
  AuditAction,
  EntitlementStatus,
  SubscriptionStatus,
} from '../domain/subscription.types.js';
import { AuditService } from './audit.service.js';
import { EntitlementPolicyService } from './entitlement-policy.service.js';
import { TenantEntitlementService } from './tenant-entitlement.service.js';
import {
  CreateTenantSubscriptionDto,
  UpdateTenantSubscriptionDto,
  type SubscriptionApplicationItemDto,
} from './dto/request/subscription.request.dto.js';
import { toSubscriptionResponse } from './mappers/subscription.mapper.js';

@Injectable()
export class TenantSubscriptionService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly policy: EntitlementPolicyService,
    private readonly audit: AuditService,
    private readonly entitlementService: TenantEntitlementService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: ISubscriptionRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY) private readonly entitlements: ITenantEntitlementRepository,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.subscriptions.findByTenant(tenantId, page, limit);
    return paginatedResponse(data.map(toSubscriptionResponse), total, page, limit);
  }

  async listAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      status?: string;
      planType?: string;
      billingCycle?: string;
      subscriptionCode?: string;
    },
  ) {
    const { data, total } = await this.subscriptions.findAll(page, limit, filters);
    return paginatedResponse(data.map(toSubscriptionResponse), total, page, limit);
  }

  async get(tenantId: string, id: string) {
    return toSubscriptionResponse(await this.require(tenantId, id));
  }

  async create(tenantId: string, dto: CreateTenantSubscriptionDto, actorUserId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) throw new NotFoundException(`Tenant '${tenantId}' not found`);

    const apps = this.resolveApplicationItems(dto);
    this.assertDateRange(dto.startDate, dto.endDate);
    await this.assertApplicationsExist(apps.map((app) => app.applicationCode));

    const applicationCodes = apps.map((app) => app.applicationCode);
    const startDate = dto.startDate.slice(0, 10);
    const endDate = dto.endDate.slice(0, 10);
    const created = await this.subscriptions.create({
      tenantId,
      subscriptionCode: await this.allocateSubscriptionCode(tenant.tenantCode, startDate),
      status: SubscriptionStatus.ACTIVE,
      planType: dto.planType,
      billingCycle: dto.billingCycle,
      applicationCodes,
      startDate,
      endDate,
      createdBy: actorUserId,
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.SUBSCRIPTION_CREATED,
      entityType: 'subscription',
      entityId: created.id,
      newValue: this.auditSnapshot(created),
    });

    for (const app of apps) {
      await this.entitlementService.establish(
        tenantId,
        {
          applicationCode: app.applicationCode,
          subscriptionId: created.id,
          launchUrl: app.launchUrl,
          maxUsers: app.maxUsers,
        },
        actorUserId,
      );
    }

    return toSubscriptionResponse(created);
  }

  async update(tenantId: string, id: string, dto: UpdateTenantSubscriptionDto, actorUserId: string) {
    const subscription = await this.require(tenantId, id);

    if (this.policy.hasPeriodEnded(subscription) && dto.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'This subscription period has ended; create a new subscription to continue',
      );
    }

    const startDate = (dto.startDate ?? subscription.startDate).slice(0, 10);
    const endDate = (dto.endDate ?? subscription.endDate ?? '').slice(0, 10);
    if (endDate) this.assertDateRange(startDate, endDate);

    const apps =
      dto.applications?.length || dto.applicationCodes?.length
        ? this.resolveApplicationItems(dto)
        : null;

    if (apps) {
      await this.assertApplicationsExist(apps.map((app) => app.applicationCode));
    }

    if (dto.status === SubscriptionStatus.ACTIVE && endDate && this.policy.hasPeriodEnded({
      ...subscription,
      endDate,
    })) {
      throw new BadRequestException(
        'This subscription period has ended; create a new subscription to continue',
      );
    }

    const applicationCodes = apps?.map((app) => app.applicationCode);
    const updated = await this.subscriptions.update(tenantId, id, {
      startDate: dto.startDate ? startDate : undefined,
      endDate: dto.endDate ? endDate : undefined,
      status: dto.status,
      planType: dto.planType,
      billingCycle: dto.billingCycle,
      applicationCodes,
    });

    if (apps && updated.id) {
      await this.syncEntitlements(tenantId, updated.id, apps, actorUserId);
    }

    if (dto.status === SubscriptionStatus.INACTIVE && updated.id) {
      await this.setLinkedEntitlementStatus(tenantId, updated.id, EntitlementStatus.INACTIVE);
    }
    if (dto.status === SubscriptionStatus.ACTIVE && updated.id) {
      await this.setLinkedEntitlementStatus(tenantId, updated.id, EntitlementStatus.ACTIVE);
    }

    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.SUBSCRIPTION_UPDATED,
      entityType: 'subscription',
      entityId: id,
      oldValue: this.auditSnapshot(subscription),
      newValue: this.auditSnapshot(updated),
    });

    return toSubscriptionResponse(updated);
  }

  private auditSnapshot(subscription: {
    subscriptionCode: string;
    status?: string;
    planType: string;
    billingCycle?: string;
    applicationCodes?: string[];
    startDate: string;
    endDate?: string;
  }) {
    return {
      subscriptionCode: subscription.subscriptionCode,
      status: subscription.status,
      planType: subscription.planType,
      billingCycle: subscription.billingCycle,
      applicationCodes: subscription.applicationCodes ?? [],
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    };
  }

  private resolveApplicationItems(
    dto: Pick<CreateTenantSubscriptionDto, 'applications' | 'applicationCodes'>,
  ): SubscriptionApplicationItemDto[] {
    if (dto.applications?.length) {
      return dto.applications;
    }
    if (dto.applicationCodes?.length) {
      return dto.applicationCodes.map((applicationCode) => ({ applicationCode }));
    }
    throw new BadRequestException('Provide applications or applicationCodes');
  }

  private async syncEntitlements(
    tenantId: string,
    subscriptionId: string,
    apps: SubscriptionApplicationItemDto[],
    actorUserId: string,
  ) {
    const wanted = new Set(apps.map((app) => app.applicationCode));
    const linked = await this.entitlements.findBySubscription(subscriptionId);
    const linkedApps = await this.applications.findByIds(linked.map((row) => row.applicationId));
    const appById = new Map(linkedApps.map((app) => [app.id!, app]));

    for (const row of linked) {
      const code = appById.get(row.applicationId)?.applicationCode;
      if (code && !wanted.has(code) && row.status === EntitlementStatus.ACTIVE) {
        await this.entitlements.update(tenantId, row.id!, { status: EntitlementStatus.INACTIVE });
      }
    }

    for (const item of apps) {
      const application = await this.applications.findByCode(item.applicationCode);
      const existing = application?.id
        ? await this.entitlements.findByTenantAndApplication(tenantId, application.id)
        : null;

      if (existing?.status === EntitlementStatus.ACTIVE) {
        const patch: {
          subscriptionId: string;
          launchUrl?: string;
          maxUsers?: number;
        } = { subscriptionId };
        if (item.launchUrl !== undefined) patch.launchUrl = item.launchUrl;
        if (item.maxUsers !== undefined) patch.maxUsers = item.maxUsers;
        await this.entitlements.update(tenantId, existing.id!, patch);
        continue;
      }

      await this.entitlementService.establish(
        tenantId,
        {
          applicationCode: item.applicationCode,
          subscriptionId,
          launchUrl: item.launchUrl,
          maxUsers: item.maxUsers,
        },
        actorUserId,
      );
    }
  }

  private async setLinkedEntitlementStatus(
    tenantId: string,
    subscriptionId: string,
    status: EntitlementStatus,
  ) {
    const linked = await this.entitlements.findBySubscription(subscriptionId);
    for (const row of linked) {
      if (row.status === status) continue;
      await this.entitlements.update(tenantId, row.id!, { status });
    }
  }

  private async require(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const subscription = await this.subscriptions.findById(tenantId, id);
    if (!subscription) throw new NotFoundException(`Subscription '${id}' not found`);
    return subscription;
  }

  private async assertApplicationsExist(codes: string[]) {
    const found = await this.applications.findByCodes(codes);
    const foundCodes = new Set(found.map((app) => app.applicationCode));
    const missing = codes.filter((code) => !foundCodes.has(code));
    if (missing.length) {
      throw new NotFoundException(`Application(s) not registered: ${missing.join(', ')}`);
    }
    for (const app of found) {
      this.policy.assertApplicationEligible(app);
    }
  }

  private assertDateRange(startDate: string, endDate: string) {
    const start = startDate.slice(0, 10);
    const end = endDate.slice(0, 10);
    if (end < start) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
  }

  private async allocateSubscriptionCode(tenantCode: string, startDate: string) {
    const base = `${tenantCode}-${startDate.replaceAll('-', '')}`.slice(0, 100);
    if (!(await this.subscriptions.findByCode(base))) return base;
    return `${base}-${Date.now()}`.slice(0, 100);
  }
}
