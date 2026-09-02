export enum ApplicationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PlanType {
  TRIAL = 'TRIAL',
  FREE = 'FREE',
  PAID = 'PAID',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum EntitlementStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  REMOVED = 'REMOVED',
}

export enum AuditAction {
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',
  APPLICATION_DEACTIVATED = 'APPLICATION_DEACTIVATED',
  PLAN_CREATED = 'PLAN_CREATED',
  PLAN_UPDATED = 'PLAN_UPDATED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_SUSPENDED = 'SUBSCRIPTION_SUSPENDED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  ENTITLEMENT_ACTIVATED = 'ENTITLEMENT_ACTIVATED',
  ENTITLEMENT_UPDATED = 'ENTITLEMENT_UPDATED',
  ENTITLEMENT_SUSPENDED = 'ENTITLEMENT_SUSPENDED',
  ENTITLEMENT_REMOVED = 'ENTITLEMENT_REMOVED',
}

export interface PlanLimits {
  applicationCodes: string[];
}

export const EMPTY_PLAN_LIMITS: PlanLimits = { applicationCodes: [] };

export interface ApplicationProps {
  id?: string;
  applicationCode: string;
  name: string;
  description?: string;
  version?: string;
  status?: ApplicationStatus;
  launchUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionPlanProps {
  id?: string;
  planCode: string;
  planName: string;
  planType: PlanType;
  billingCycle?: BillingCycle;
  price?: number;
  trialDays?: number;
  limits?: PlanLimits;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionProps {
  id?: string;
  tenantId: string;
  planId?: string;
  subscriptionCode: string;
  status?: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantEntitlementProps {
  id?: string;
  tenantId: string;
  applicationId: string;
  subscriptionId?: string;
  status?: EntitlementStatus;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuditEventProps {
  id?: string;
  tenantId?: string;
  actorUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt?: Date;
}

export interface ReconciliationSummary {
  activeMemberships: number;
  applicationsNowUnavailable: string[];
  membershipsUnchanged: true;
}

export type AccessDeniedReason =
  | 'APPLICATION_NOT_FOUND'
  | 'APPLICATION_INACTIVE'
  | 'ENTITLEMENT_NOT_FOUND'
  | 'ENTITLEMENT_SUSPENDED'
  | 'ENTITLEMENT_REMOVED'
  | 'ENTITLEMENT_EXPIRED'
  | 'ENTITLEMENT_NOT_YET_EFFECTIVE'
  | 'SUBSCRIPTION_INACTIVE'
  | 'SUBSCRIPTION_EXPIRED';
