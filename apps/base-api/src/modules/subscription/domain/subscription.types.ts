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
  INACTIVE = 'INACTIVE',
}

export enum EntitlementStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum AuditAction {
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',
  APPLICATION_DEACTIVATED = 'APPLICATION_DEACTIVATED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  ENTITLEMENT_CREATED = 'ENTITLEMENT_CREATED',
  ENTITLEMENT_UPDATED = 'ENTITLEMENT_UPDATED',
}

export interface ApplicationProps {
  id?: string;
  applicationCode: string;
  name: string;
  description?: string;
  version?: string;
  status?: ApplicationStatus;
  launchUrl?: string;
  logoUrl?: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionProps {
  id?: string;
  tenantId: string;
  subscriptionCode: string;
  status?: SubscriptionStatus;
  planType: PlanType;
  billingCycle?: BillingCycle;
  applicationCodes: string[];
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
  commercialReference?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuditEventProps {
  id?: string;
  tenantId?: string;
  /** Identity ID (`audit_events.actor_identity_id`) */
  actorUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  createdAt?: Date;
}

export interface AuditEventSearchFilters {
  tenantId?: string;
  /** Identity ID (`audit_events.actor_identity_id`) */
  actorUserId?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

export type AccessDeniedReason =
  | 'APPLICATION_NOT_FOUND'
  | 'APPLICATION_INACTIVE'
  | 'ENTITLEMENT_NOT_FOUND'
  | 'ENTITLEMENT_INACTIVE'
  | 'ENTITLEMENT_NOT_YET_EFFECTIVE'
  | 'SUBSCRIPTION_INACTIVE'
  | 'SUBSCRIPTION_ENDED';
