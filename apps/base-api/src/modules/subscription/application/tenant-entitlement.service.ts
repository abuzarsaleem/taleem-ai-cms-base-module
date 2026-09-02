import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  APPLICATION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type IApplicationRepository,
  type ITenantEntitlementRepository,
} from '../domain/subscription.repository.interface.js';
import {
  AuditAction,
  EntitlementStatus,
  type ApplicationProps,
  type TenantEntitlementProps,
} from '../domain/subscription.types.js';
import { AuditService } from './audit.service.js';
import { EntitlementPolicyService } from './entitlement-policy.service.js';
import {
  CreateTenantEntitlementDto,
  UpdateTenantEntitlementDto,
} from './dto/request/subscription.request.dto.js';
import { toEntitlementResponse } from './mappers/subscription.mapper.js';

@Injectable()
export class TenantEntitlementService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly policy: EntitlementPolicyService,
    private readonly audit: AuditService,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY) private readonly entitlements: ITenantEntitlementRepository,
  ) {}

  async list(tenantId: string, page: number, limit: number) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const { data, total } = await this.entitlements.findByTenant(tenantId, page, limit);
    const apps = await this.applicationMap(data.map((row) => row.applicationId));
    return paginatedResponse(
      data.map((row) => toEntitlementResponse(row, apps.get(row.applicationId))),
      total,
      page,
      limit,
    );
  }

  async get(tenantId: string, id: string) {
    const { entitlement, application } = await this.require(tenantId, id);
    return toEntitlementResponse(entitlement, application);
  }

  async establish(tenantId: string, dto: CreateTenantEntitlementDto, actorUserId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const application = await this.requireApplication(dto.applicationCode);
    this.policy.assertApplicationEligible(application);

    if (dto.subscriptionId) {
      await this.policy.assertSubscriptionAllowsApplication(
        tenantId,
        dto.subscriptionId,
        application.applicationCode,
      );
    }

    const existing = await this.entitlements.findByTenantAndApplication(tenantId, application.id!);
    if (existing?.status === EntitlementStatus.ACTIVE) {
      throw new ConflictException(
        `Tenant is already entitled to application '${application.applicationCode}'`,
      );
    }

    const period = this.parsePeriod(dto.effectiveFrom, dto.effectiveUntil);
    const saved = existing
      ? await this.entitlements.update(tenantId, existing.id!, {
          subscriptionId: dto.subscriptionId ?? existing.subscriptionId,
          status: EntitlementStatus.ACTIVE,
          effectiveFrom: period.effectiveFrom,
          effectiveUntil: period.effectiveUntil,
        })
      : await this.entitlements.create({
          tenantId,
          applicationId: application.id!,
          subscriptionId: dto.subscriptionId,
          status: EntitlementStatus.ACTIVE,
          effectiveFrom: period.effectiveFrom,
          effectiveUntil: period.effectiveUntil,
          createdBy: actorUserId,
        });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.ENTITLEMENT_ACTIVATED,
      entityType: 'tenant_entitlement',
      entityId: saved.id,
      oldValue: existing ? { status: existing.status } : null,
      newValue: { status: saved.status, applicationCode: application.applicationCode },
    });

    return toEntitlementResponse(saved, application);
  }

  async update(tenantId: string, id: string, dto: UpdateTenantEntitlementDto, actorUserId: string) {
    const { entitlement, application } = await this.require(tenantId, id);
    if (dto.subscriptionId) {
      await this.policy.assertSubscriptionAllowsApplication(
        tenantId,
        dto.subscriptionId,
        application.applicationCode,
      );
    }
    const period = this.parsePeriod(
      dto.effectiveFrom ?? entitlement.effectiveFrom?.toISOString(),
      dto.effectiveUntil === undefined
        ? entitlement.effectiveUntil?.toISOString()
        : dto.effectiveUntil,
    );
    const patch: Partial<TenantEntitlementProps> = {};
    if (dto.subscriptionId) patch.subscriptionId = dto.subscriptionId;
    if (dto.effectiveFrom) patch.effectiveFrom = period.effectiveFrom;
    if (dto.effectiveUntil !== undefined) patch.effectiveUntil = period.effectiveUntil;
    const updated = await this.entitlements.update(tenantId, id, patch);
    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.ENTITLEMENT_UPDATED,
      entityType: 'tenant_entitlement',
      entityId: id,
      oldValue: {
        subscriptionId: entitlement.subscriptionId,
        effectiveFrom: entitlement.effectiveFrom,
        effectiveUntil: entitlement.effectiveUntil,
      },
      newValue: {
        subscriptionId: updated.subscriptionId,
        effectiveFrom: updated.effectiveFrom,
        effectiveUntil: updated.effectiveUntil,
      },
    });
    return toEntitlementResponse(updated, application);
  }

  async activate(tenantId: string, id: string, actorUserId: string) {
    const { entitlement, application } = await this.require(tenantId, id);
    if (entitlement.status === EntitlementStatus.REMOVED) {
      throw new BadRequestException('Revoked entitlements must be established again');
    }
    if (entitlement.status === EntitlementStatus.ACTIVE) {
      throw new BadRequestException('Entitlement is already active');
    }
    this.policy.assertApplicationEligible(application);
    if (entitlement.subscriptionId) {
      await this.policy.assertSubscriptionAllowsApplication(
        tenantId,
        entitlement.subscriptionId,
        application.applicationCode,
      );
    }
    const updated = await this.entitlements.update(tenantId, id, {
      status: EntitlementStatus.ACTIVE,
      effectiveFrom: new Date(),
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.ENTITLEMENT_ACTIVATED,
      entityType: 'tenant_entitlement',
      entityId: id,
      oldValue: { status: entitlement.status },
      newValue: { status: updated.status },
    });
    return this.withReconciliation(tenantId, updated, application, []);
  }

  async suspend(tenantId: string, id: string, actorUserId: string) {
    const { entitlement, application } = await this.require(tenantId, id);
    if (entitlement.status !== EntitlementStatus.ACTIVE) {
      throw new BadRequestException(`Entitlement is ${(entitlement.status ?? EntitlementStatus.ACTIVE).toLowerCase()}`);
    }
    const updated = await this.entitlements.update(tenantId, id, {
      status: EntitlementStatus.SUSPENDED,
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.ENTITLEMENT_SUSPENDED,
      entityType: 'tenant_entitlement',
      entityId: id,
      oldValue: { status: entitlement.status },
      newValue: { status: updated.status },
    });
    return this.withReconciliation(tenantId, updated, application, [application.applicationCode]);
  }

  async revoke(tenantId: string, id: string, actorUserId: string) {
    const { entitlement, application } = await this.require(tenantId, id);
    if (entitlement.status === EntitlementStatus.REMOVED) {
      throw new BadRequestException('Entitlement is already removed');
    }
    const updated = await this.entitlements.update(tenantId, id, {
      status: EntitlementStatus.REMOVED,
      effectiveUntil: new Date(),
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: AuditAction.ENTITLEMENT_REMOVED,
      entityType: 'tenant_entitlement',
      entityId: id,
      oldValue: { status: entitlement.status },
      newValue: { status: updated.status },
    });
    return this.withReconciliation(tenantId, updated, application, [application.applicationCode]);
  }

  private async withReconciliation(
    tenantId: string,
    entitlement: TenantEntitlementProps,
    application: ApplicationProps,
    unavailable: string[],
  ) {
    return {
      ...toEntitlementResponse(entitlement, application),
      reconciliation: await this.policy.buildReconciliation(tenantId, unavailable),
    };
  }

  private async require(tenantId: string, id: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    const entitlement = await this.entitlements.findById(tenantId, id);
    if (!entitlement) throw new NotFoundException(`Entitlement '${id}' not found`);
    const application = await this.applications.findById(entitlement.applicationId);
    if (!application) throw new NotFoundException(`Application '${entitlement.applicationId}' not found`);
    return { entitlement, application };
  }

  private async requireApplication(applicationCode: string) {
    const application = await this.applications.findByCode(applicationCode);
    if (!application) {
      throw new NotFoundException(`Application '${applicationCode}' is not registered`);
    }
    return application;
  }

  private async applicationMap(ids: string[]) {
    const unique = [...new Set(ids)];
    const rows = await this.applications.findByIds(unique);
    return new Map(rows.map((row) => [row.id!, row]));
  }

  private parsePeriod(effectiveFrom?: string, effectiveUntil?: string) {
    const from = effectiveFrom ? new Date(effectiveFrom) : new Date();
    const until = effectiveUntil ? new Date(effectiveUntil) : undefined;
    if (until && until <= from) {
      throw new BadRequestException('effectiveUntil must be after effectiveFrom');
    }
    return { effectiveFrom: from, effectiveUntil: until };
  }
}
