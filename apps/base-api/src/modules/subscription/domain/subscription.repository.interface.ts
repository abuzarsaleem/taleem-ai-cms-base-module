import type {
  ApplicationProps,
  AuditEventProps,
  SubscriptionPlanProps,
  SubscriptionProps,
  TenantEntitlementProps,
} from './subscription.types.js';

export const APPLICATION_REPOSITORY = Symbol('APPLICATION_REPOSITORY');
export const SUBSCRIPTION_PLAN_REPOSITORY = Symbol('SUBSCRIPTION_PLAN_REPOSITORY');
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
}

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlanProps | null>;
  findByCode(planCode: string): Promise<SubscriptionPlanProps | null>;
  findAll(page: number, limit: number): Promise<{ data: SubscriptionPlanProps[]; total: number }>;
  create(props: SubscriptionPlanProps): Promise<SubscriptionPlanProps>;
  update(id: string, props: Partial<SubscriptionPlanProps>): Promise<SubscriptionPlanProps>;
}

export interface ISubscriptionRepository {
  findByTenant(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: SubscriptionProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<SubscriptionProps | null>;
  findByIds(ids: string[]): Promise<SubscriptionProps[]>;
  findByCode(subscriptionCode: string): Promise<SubscriptionProps | null>;
  create(props: SubscriptionProps): Promise<SubscriptionProps>;
  update(tenantId: string, id: string, props: Partial<SubscriptionProps>): Promise<SubscriptionProps>;
}

export interface ITenantEntitlementRepository {
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
}

export interface IAuditEventRepository {
  create(props: AuditEventProps): Promise<AuditEventProps>;
}
