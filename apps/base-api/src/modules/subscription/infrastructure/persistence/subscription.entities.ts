import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import {
  ApplicationStatus,
  BillingCycle,
  EntitlementStatus,
  PlanType,
  SubscriptionStatus,
} from '../../domain/subscription.types.js';

@Entity({ name: 'applications', schema: DATABASE_SCHEMA })
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_code', type: 'varchar', length: 50, unique: true })
  applicationCode!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  version?: string;

  @Column({ type: 'varchar', length: 30, default: ApplicationStatus.ACTIVE })
  status!: ApplicationStatus;

  @Column({ name: 'launch_url', type: 'varchar', length: 500, nullable: true })
  launchUrl?: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'subscriptions', schema: DATABASE_SCHEMA })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'subscription_code', type: 'varchar', length: 100, unique: true })
  subscriptionCode!: string;

  @Column({ type: 'varchar', length: 30, default: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;

  @Column({ name: 'plan_type', type: 'varchar', length: 30 })
  planType!: PlanType;

  @Column({ name: 'billing_cycle', type: 'varchar', length: 30, nullable: true })
  billingCycle?: BillingCycle;

  @Column({ name: 'application_codes', type: 'jsonb', default: () => "'[]'" })
  applicationCodes!: string[];

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}

@Entity({ name: 'tenant_entitlements', schema: DATABASE_SCHEMA })
export class TenantEntitlementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId?: string;

  @Column({ type: 'varchar', length: 30, default: EntitlementStatus.ACTIVE })
  status!: EntitlementStatus;

  @Column({ name: 'effective_from', type: 'timestamptz', default: () => 'now()' })
  effectiveFrom!: Date;

  @Column({ name: 'effective_until', type: 'timestamptz', nullable: true })
  effectiveUntil?: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}

@Entity({ name: 'audit_events', schema: DATABASE_SCHEMA })
export class AuditEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId?: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100, nullable: true })
  entityType?: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue?: Record<string, unknown> | null;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue?: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
