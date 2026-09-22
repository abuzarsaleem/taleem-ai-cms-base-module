import type {
  ApplicationProps,
  AuditEventProps,
  AuditEventSearchFilters,
  SubscriptionProps,
  TenantEntitlementProps,
} from './subscription.types.js';

export const APPLICATION_REPOSITORY = Symbol('APPLICATION_REPOSITORY');
export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');
export const TENANT_ENTITLEMENT_REPOSITORY = Symbol('TENANT_ENTITLEMENT_REPOSITORY');
export const AUDIT_EVENT_REPOSITORY = Symbol('AUDIT_EVENT_REPOSITORY');

export interface IApplicationRepository {
  findById(id: string): Promise<ApplicationProps | null>;
  findByIds(ids: string[]): Promise<ApplicationProps[]>;
  findByCode(applicationCode: string): Promise<ApplicationProps | null>;
  findByCodes(codes: string[]): Promise<ApplicationProps[]>;
  findAll(page: number, limit: number): Promise<{ data: ApplicationProps[]; total: number }>;
  create(props: ApplicationProps): Promise<ApplicationProps>;
  update(id: string, props: Partial<ApplicationProps>): Promise<ApplicationProps>;
  countByStatus(): Promise<{ total: number; active: number; inactive: number }>;
  countCreatedBefore(date: Date): Promise<{ total: number; active: number; inactive: number }>;
  findLatestVersioned(): Promise<ApplicationProps | null>;
}

export interface ISubscriptionRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      status?: string;
      planType?: string;
      billingCycle?: string;
      subscriptionCode?: string;
    },
  ): Promise<{ data: SubscriptionProps[]; total: number }>;
  findByTenant(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: SubscriptionProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<SubscriptionProps | null>;
  findByIds(ids: string[]): Promise<SubscriptionProps[]>;
  findByCode(subscriptionCode: string): Promise<SubscriptionProps | null>;
  /** ACTIVE subscriptions whose end_date equals the given YYYY-MM-DD */
  findActiveEndingOn(endDate: string): Promise<SubscriptionProps[]>;
  /** ACTIVE subscriptions whose end_date is on or before the given YYYY-MM-DD */
  findActiveEndedOnOrBefore(endDate: string): Promise<SubscriptionProps[]>;
  create(props: SubscriptionProps): Promise<SubscriptionProps>;
  update(tenantId: string, id: string, props: Partial<SubscriptionProps>): Promise<SubscriptionProps>;
}

export interface ITenantEntitlementRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      applicationId?: string;
      subscriptionId?: string;
      status?: string;
    },
  ): Promise<{ data: TenantEntitlementProps[]; total: number }>;
  findByTenant(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: TenantEntitlementProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantEntitlementProps | null>;
  findByTenantAndApplication(
    tenantId: string,
    applicationId: string,
  ): Promise<TenantEntitlementProps | null>;
  findBySubscription(subscriptionId: string): Promise<TenantEntitlementProps[]>;
  findAllByTenant(tenantId: string): Promise<TenantEntitlementProps[]>;
  create(props: TenantEntitlementProps): Promise<TenantEntitlementProps>;
  update(
    tenantId: string,
    id: string,
    props: Partial<TenantEntitlementProps>,
  ): Promise<TenantEntitlementProps>;
  /** Distinct commercially usable tenants per application (ACTIVE + in-period entitlement/subscription). */
  countDistinctTenantsByApplicationIds(
    applicationIds: string[],
  ): Promise<Map<string, number>>;
  /** Distinct commercially usable applications per tenant (ACTIVE + in-period entitlement/subscription). */
  countDistinctApplicationsByTenantIds(tenantIds: string[]): Promise<Map<string, number>>;
}

export interface IAuditEventRepository {
  create(props: AuditEventProps): Promise<AuditEventProps>;
  search(
    filters: AuditEventSearchFilters,
    page: number,
    limit: number,
  ): Promise<{ data: AuditEventProps[]; total: number }>;
}
