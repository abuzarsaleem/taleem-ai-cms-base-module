import {
  ApplicationStatus,
  EntitlementStatus,
  SubscriptionStatus,
  type ApplicationProps,
  type SubscriptionProps,
  type TenantEntitlementProps,
} from '../../domain/subscription.types.js';
import { toDateOnly } from '../date.util.js';
import type {
  ApplicationResponseDto,
  EntitlementResponseDto,
  SubscriptionResponseDto,
} from '../dto/response/subscription.response.dto.js';

export function effectiveSubscriptionStatus(
  subscription: SubscriptionProps,
  at = new Date(),
): SubscriptionStatus {
  if (subscription.status === SubscriptionStatus.INACTIVE) {
    return SubscriptionStatus.INACTIVE;
  }
  const today = toDateOnly(at);
  if (subscription.endDate && subscription.endDate < today) {
    return SubscriptionStatus.INACTIVE;
  }
  return SubscriptionStatus.ACTIVE;
}

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

export function toSubscriptionResponse(props: SubscriptionProps): SubscriptionResponseDto {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    subscriptionCode: props.subscriptionCode,
    status: effectiveSubscriptionStatus(props),
    planType: props.planType,
    billingCycle: props.billingCycle,
    applicationCodes: props.applicationCodes ?? [],
    startDate: props.startDate,
    endDate: props.endDate ?? '',
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
