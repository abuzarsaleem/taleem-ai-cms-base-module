import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import type {
  IApplicationRepository,
  IAuditEventRepository,
  ISubscriptionPlanRepository,
  ISubscriptionRepository,
  ITenantEntitlementRepository,
} from '../../domain/subscription.repository.interface.js';
import {
  EMPTY_PLAN_LIMITS,
  type ApplicationProps,
  type AuditEventProps,
  type AuditEventSearchFilters,
  type PlanLimits,
  type SubscriptionPlanProps,
  type SubscriptionProps,
  type TenantEntitlementProps,
} from '../../domain/subscription.types.js';
import {
  ApplicationEntity,
  AuditEventEntity,
  SubscriptionEntity,
  SubscriptionPlanEntity,
  TenantEntitlementEntity,
} from './subscription.entities.js';

function notFound(resource: string, id: string): never {
  throw new NotFoundException(`${resource} '${id}' not found`);
}

function rethrowUnique(error: unknown, message: string): never {
  if (error instanceof QueryFailedError && (error as { driverError?: { code?: string } }).driverError?.code === '23505') {
    throw new ConflictException(message);
  }
  if (error instanceof QueryFailedError && (error as { code?: string }).code === '23505') {
    throw new ConflictException(message);
  }
  throw error;
}

function asDateOnly(value: string | Date | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function normalizeLimits(limits?: PlanLimits | Record<string, unknown> | null): PlanLimits {
  const codes = (limits as PlanLimits | undefined)?.applicationCodes;
  return { applicationCodes: Array.isArray(codes) ? codes : [] };
}

@Injectable()
export class TypeOrmApplicationRepository implements IApplicationRepository {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly repo: Repository<ApplicationEntity>,
  ) {}

  async findById(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByIds(ids: string[]) {
    if (!ids.length) return [];
    const rows = await this.repo.find({ where: { id: In(ids) } });
    return rows.map((row) => this.map(row));
  }

  async findByCode(applicationCode: string) {
    const row = await this.repo.findOne({ where: { applicationCode } });
    return row ? this.map(row) : null;
  }

  async findByCodes(codes: string[]) {
    if (!codes.length) return [];
    const rows = await this.repo.find({ where: { applicationCode: In(codes) } });
    return rows.map((row) => this.map(row));
  }

  async findAll(page: number, limit: number) {
    const [rows, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: rows.map((row) => this.map(row)), total };
  }

  async create(props: ApplicationProps) {
    try {
      return this.map(await this.repo.save(this.repo.create(props)));
    } catch (error) {
      rethrowUnique(error, `Application code '${props.applicationCode}' already exists`);
    }
  }

  async update(id: string, props: Partial<ApplicationProps>) {
    if (!(await this.findById(id))) notFound('Application', id);
    await this.repo.update(id, props);
    return this.map(await this.repo.findOneOrFail({ where: { id } }));
  }

  private map(e: ApplicationEntity): ApplicationProps {
    return {
      id: e.id,
      applicationCode: e.applicationCode,
      name: e.name,
      description: e.description,
      version: e.version,
      status: e.status,
      launchUrl: e.launchUrl,
      createdBy: e.createdBy,
      updatedBy: e.updatedBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmSubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly repo: Repository<SubscriptionPlanEntity>,
  ) {}

  async findById(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByCode(planCode: string) {
    const row = await this.repo.findOne({ where: { planCode } });
    return row ? this.map(row) : null;
  }

  async findAll(page: number, limit: number) {
    const [rows, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: rows.map((row) => this.map(row)), total };
  }

  async create(props: SubscriptionPlanProps) {
    try {
      return this.map(
        await this.repo.save(
          this.repo.create({
            planCode: props.planCode,
            planName: props.planName,
            planType: props.planType,
            billingCycle: props.billingCycle,
            price: String(props.price ?? 0),
            trialDays: props.trialDays,
            limits: normalizeLimits(props.limits),
            isActive: props.isActive ?? true,
            createdBy: props.createdBy,
            updatedBy: props.updatedBy,
          }),
        ),
      );
    } catch (error) {
      rethrowUnique(error, `Plan code '${props.planCode}' already exists`);
    }
  }

  async update(id: string, props: Partial<SubscriptionPlanProps>) {
    if (!(await this.findById(id))) notFound('Subscription plan', id);
    const patch: Partial<SubscriptionPlanEntity> = {};
    if (props.planName !== undefined) patch.planName = props.planName;
    if (props.planType !== undefined) patch.planType = props.planType;
    if (props.billingCycle !== undefined) patch.billingCycle = props.billingCycle;
    if (props.trialDays !== undefined) patch.trialDays = props.trialDays;
    if (props.isActive !== undefined) patch.isActive = props.isActive;
    if (props.updatedBy !== undefined) patch.updatedBy = props.updatedBy;
    if (props.limits) patch.limits = normalizeLimits(props.limits);
    if (props.price !== undefined) patch.price = String(props.price);
    await this.repo.update(id, patch);
    return this.map(await this.repo.findOneOrFail({ where: { id } }));
  }

  private map(e: SubscriptionPlanEntity): SubscriptionPlanProps {
    return {
      id: e.id,
      planCode: e.planCode,
      planName: e.planName,
      planType: e.planType,
      billingCycle: e.billingCycle,
      price: Number(e.price),
      trialDays: e.trialDays,
      limits: normalizeLimits(e.limits ?? EMPTY_PLAN_LIMITS),
      isActive: e.isActive,
      createdBy: e.createdBy,
      updatedBy: e.updatedBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmSubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repo: Repository<SubscriptionEntity>,
  ) {}

  async findByTenant(tenantId: string, page: number, limit: number) {
    const [rows, total] = await this.repo.findAndCount({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: rows.map((row) => this.map(row)), total };
  }

  async findById(tenantId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async findByIds(ids: string[]) {
    if (!ids.length) return [];
    const rows = await this.repo.find({ where: { id: In(ids) } });
    return rows.map((row) => this.map(row));
  }

  async findByCode(subscriptionCode: string) {
    const row = await this.repo.findOne({ where: { subscriptionCode } });
    return row ? this.map(row) : null;
  }

  async create(props: SubscriptionProps) {
    try {
      return this.map(await this.repo.save(this.repo.create(props)));
    } catch (error) {
      rethrowUnique(error, `Subscription code '${props.subscriptionCode}' already exists`);
    }
  }

  async update(tenantId: string, id: string, props: Partial<SubscriptionProps>) {
    if (!(await this.findById(tenantId, id))) notFound('Subscription', id);
    await this.repo.update({ id, tenantId }, { ...props, updatedAt: new Date() });
    return this.map(await this.repo.findOneOrFail({ where: { id, tenantId } }));
  }

  private map(e: SubscriptionEntity): SubscriptionProps {
    return {
      id: e.id,
      tenantId: e.tenantId,
      planId: e.planId,
      subscriptionCode: e.subscriptionCode,
      status: e.status,
      startDate: asDateOnly(e.startDate) ?? e.startDate,
      endDate: asDateOnly(e.endDate),
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmTenantEntitlementRepository implements ITenantEntitlementRepository {
  constructor(
    @InjectRepository(TenantEntitlementEntity)
    private readonly repo: Repository<TenantEntitlementEntity>,
  ) {}

  async findByTenant(tenantId: string, page: number, limit: number) {
    const [rows, total] = await this.repo.findAndCount({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: rows.map((row) => this.map(row)), total };
  }

  async findById(tenantId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.map(row) : null;
  }

  async findByTenantAndApplication(tenantId: string, applicationId: string) {
    const row = await this.repo.findOne({ where: { tenantId, applicationId } });
    return row ? this.map(row) : null;
  }

  async findBySubscription(subscriptionId: string) {
    const rows = await this.repo.find({ where: { subscriptionId }, order: { createdAt: 'DESC' } });
    return rows.map((row) => this.map(row));
  }

  async findAllByTenant(tenantId: string) {
    const rows = await this.repo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
    return rows.map((row) => this.map(row));
  }

  async create(props: TenantEntitlementProps) {
    try {
      return this.map(await this.repo.save(this.repo.create(props)));
    } catch (error) {
      rethrowUnique(error, 'Tenant is already entitled to this application');
    }
  }

  async update(tenantId: string, id: string, props: Partial<TenantEntitlementProps>) {
    if (!(await this.findById(tenantId, id))) notFound('Entitlement', id);
    await this.repo.update({ id, tenantId }, { ...props, updatedAt: new Date() });
    return this.map(await this.repo.findOneOrFail({ where: { id, tenantId } }));
  }

  private map(e: TenantEntitlementEntity): TenantEntitlementProps {
    return {
      id: e.id,
      tenantId: e.tenantId,
      applicationId: e.applicationId,
      subscriptionId: e.subscriptionId,
      status: e.status,
      effectiveFrom: e.effectiveFrom,
      effectiveUntil: e.effectiveUntil,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

@Injectable()
export class TypeOrmAuditEventRepository implements IAuditEventRepository {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly repo: Repository<AuditEventEntity>,
  ) {}

  async create(props: AuditEventProps) {
    return this.map(await this.repo.save(this.repo.create(props)));
  }

  async search(filters: AuditEventSearchFilters, page: number, limit: number) {
    const qb = this.repo.createQueryBuilder('audit').orderBy('audit.created_at', 'DESC');

    if (filters.tenantId) {
      qb.andWhere('audit.tenant_id = :tenantId', { tenantId: filters.tenantId });
    }
    if (filters.actorUserId) {
      qb.andWhere('audit.actor_user_id = :actorUserId', { actorUserId: filters.actorUserId });
    }
    if (filters.action) {
      qb.andWhere('audit.action = :action', { action: filters.action });
    }
    if (filters.from) {
      qb.andWhere('audit.created_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('audit.created_at <= :to', { to: filters.to });
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: rows.map((row) => this.map(row)), total };
  }

  private map(e: AuditEventEntity): AuditEventProps {
    return {
      id: e.id,
      tenantId: e.tenantId,
      actorUserId: e.actorUserId,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      oldValue: e.oldValue,
      newValue: e.newValue,
      ipAddress: e.ipAddress,
      createdAt: e.createdAt,
    };
  }
}
