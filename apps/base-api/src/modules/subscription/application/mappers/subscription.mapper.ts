import {
  ApplicationStatus,
  EntitlementStatus,
  SubscriptionStatus,
  type ApplicationProps,
  type SubscriptionPlanProps,
  type SubscriptionProps,
  type TenantEntitlementProps,
} from '../../domain/subscription.types.js';
import type {
  ApplicationResponseDto,
  EntitlementResponseDto,
  SubscriptionPlanResponseDto,
  SubscriptionResponseDto,
} from '../dto/response/subscription.response.dto.js';

export function toApplicationResponse(props: ApplicationProps): ApplicationResponseDto {
  return {
    id: props.id!,
    applicationCode: props.applicationCode,
    name: props.name,
    description: props.description,
    version: props.version,
    status: props.status ?? ApplicationStatus.ACTIVE,
    launchUrl: props.launchUrl,
    createdAt: props.createdAt!,
    updatedAt: props.updatedAt!,
  };
}

export function toPlanResponse(props: SubscriptionPlanProps): SubscriptionPlanResponseDto {
  return {
    id: props.id!,
    planCode: props.planCode,
    planName: props.planName,
    planType: props.planType,
    billingCycle: props.billingCycle,
    price: props.price ?? 0,
    trialDays: props.trialDays,
    limits: { applicationCodes: props.limits?.applicationCodes ?? [] },
    isActive: props.isActive ?? true,
    createdAt: props.createdAt!,
    updatedAt: props.updatedAt!,
  };
}

export function toSubscriptionResponse(props: SubscriptionProps): SubscriptionResponseDto {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    planId: props.planId,
    subscriptionCode: props.subscriptionCode,
    status: props.status ?? SubscriptionStatus.ACTIVE,
    startDate: props.startDate,
    endDate: props.endDate,
    createdAt: props.createdAt!,
    updatedAt: props.updatedAt!,
  };
}

export function toEntitlementResponse(
  props: TenantEntitlementProps,
  application?: Pick<ApplicationProps, 'applicationCode' | 'name'>,
): EntitlementResponseDto {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    applicationId: props.applicationId,
    applicationCode: application?.applicationCode,
    applicationName: application?.name,
    subscriptionId: props.subscriptionId,
    status: props.status ?? EntitlementStatus.ACTIVE,
    effectiveFrom: props.effectiveFrom!,
    effectiveUntil: props.effectiveUntil,
    createdAt: props.createdAt!,
    updatedAt: props.updatedAt!,
  };
}
