import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import {
  SUBSCRIPTION_PLAN_REPOSITORY,
  type ISubscriptionPlanRepository,
} from '../domain/subscription.repository.interface.js';
import { AuditAction, EMPTY_PLAN_LIMITS, PlanType } from '../domain/subscription.types.js';
import { AuditService } from './audit.service.js';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/request/subscription.request.dto.js';
import { toPlanResponse } from './mappers/subscription.mapper.js';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly plans: ISubscriptionPlanRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateSubscriptionPlanDto, actorUserId: string) {
    this.assertPlanRules(dto.planType, dto.trialDays);
    const existing = await this.plans.findByCode(dto.planCode);
    if (existing) {
      throw new ConflictException(`Plan code '${dto.planCode}' already exists`);
    }
    const created = await this.plans.create({
      planCode: dto.planCode,
      planName: dto.planName,
      planType: dto.planType,
      billingCycle: dto.billingCycle,
      price: dto.price ?? 0,
      trialDays: dto.trialDays,
      limits: { applicationCodes: dto.limits?.applicationCodes ?? EMPTY_PLAN_LIMITS.applicationCodes },
      isActive: true,
      createdBy: actorUserId,
    });
    await this.audit.record({
      actorUserId,
      action: AuditAction.PLAN_CREATED,
      entityType: 'subscription_plan',
      entityId: created.id,
      newValue: { planCode: created.planCode, limits: created.limits },
    });
    return toPlanResponse(created);
  }

  async findAll(page = 1, limit = 20) {
    const { data, total } = await this.plans.findAll(page, limit);
    return paginatedResponse(data.map(toPlanResponse), total, page, limit);
  }

  async findById(id: string) {
    const plan = await this.plans.findById(id);
    if (!plan) throw new NotFoundException(`Subscription plan '${id}' not found`);
    return toPlanResponse(plan);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto, actorUserId: string) {
    const before = await this.plans.findById(id);
    if (!before) throw new NotFoundException(`Subscription plan '${id}' not found`);
    const planType = dto.planType ?? before.planType;
    const trialDays = dto.trialDays === undefined ? before.trialDays : dto.trialDays;
    this.assertPlanRules(planType, trialDays);
    const updated = await this.plans.update(id, {
      ...dto,
      limits: dto.limits
        ? { applicationCodes: dto.limits.applicationCodes ?? [] }
        : undefined,
      updatedBy: actorUserId,
    });
    await this.audit.record({
      actorUserId,
      action: AuditAction.PLAN_UPDATED,
      entityType: 'subscription_plan',
      entityId: id,
      oldValue: { planName: before.planName, isActive: before.isActive, limits: before.limits },
      newValue: { planName: updated.planName, isActive: updated.isActive, limits: updated.limits },
    });
    return toPlanResponse(updated);
  }

  private assertPlanRules(planType: PlanType, trialDays?: number) {
    if (trialDays !== undefined && planType !== PlanType.TRIAL) {
      throw new BadRequestException('trialDays is only allowed when planType is TRIAL');
    }
  }
}
