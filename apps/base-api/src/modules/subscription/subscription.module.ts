import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantModule } from '../tenant/tenant.module.js';
import {
  APPLICATION_REPOSITORY,
  AUDIT_EVENT_REPOSITORY,
  SUBSCRIPTION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
} from './domain/subscription.repository.interface.js';
import {
  ApplicationEntity,
  AuditEventEntity,
  SubscriptionEntity,
  TenantEntitlementEntity,
} from './infrastructure/persistence/subscription.entities.js';
import {
  TypeOrmApplicationRepository,
  TypeOrmAuditEventRepository,
  TypeOrmSubscriptionRepository,
  TypeOrmTenantEntitlementRepository,
} from './infrastructure/persistence/typeorm-subscription.repositories.js';
import { AuditService } from './application/audit.service.js';
import { AuditQueryService } from './application/audit-query.service.js';
import { ApplicationCatalogService } from './application/application-catalog.service.js';
import { EntitlementPolicyService } from './application/entitlement-policy.service.js';
import { TenantAvailabilityService } from './application/tenant-availability.service.js';
import { TenantEntitlementService } from './application/tenant-entitlement.service.js';
import { TenantSubscriptionService } from './application/tenant-subscription.service.js';
import {
  ApplicationCatalogController,
  TenantAvailabilityController,
} from './presentation/application-catalog.controller.js';
import { TenantEntitlementController } from './presentation/tenant-entitlement.controller.js';
import { TenantSubscriptionController } from './presentation/tenant-subscription.controller.js';
import {
  PlatformEntitlementController,
  PlatformSubscriptionController,
} from './presentation/platform-subscription.controllers.js';
import { AuditEventController } from './presentation/audit-event.controller.js';

const entities = [
  ApplicationEntity,
  SubscriptionEntity,
  TenantEntitlementEntity,
  AuditEventEntity,
];

const repositories = [
  { provide: APPLICATION_REPOSITORY, useClass: TypeOrmApplicationRepository },
  { provide: SUBSCRIPTION_REPOSITORY, useClass: TypeOrmSubscriptionRepository },
  { provide: TENANT_ENTITLEMENT_REPOSITORY, useClass: TypeOrmTenantEntitlementRepository },
  { provide: AUDIT_EVENT_REPOSITORY, useClass: TypeOrmAuditEventRepository },
];

@Module({
  imports: [TypeOrmModule.forFeature(entities), TenantModule],
  controllers: [
    ApplicationCatalogController,
    TenantAvailabilityController,
    TenantSubscriptionController,
    TenantEntitlementController,
    PlatformSubscriptionController,
    PlatformEntitlementController,
    AuditEventController,
  ],
  providers: [
    AuditService,
    AuditQueryService,
    EntitlementPolicyService,
    ApplicationCatalogService,
    TenantEntitlementService,
    TenantSubscriptionService,
    TenantAvailabilityService,
    ...repositories,
  ],
  exports: [EntitlementPolicyService, APPLICATION_REPOSITORY],
})
export class SubscriptionModule {}
