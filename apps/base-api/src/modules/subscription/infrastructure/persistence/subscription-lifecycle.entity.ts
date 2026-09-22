import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';

export enum SubscriptionLifecycleEventType {
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  EXPIRED = 'EXPIRED',
}

@Entity({ name: 'subscription_lifecycle_events', schema: DATABASE_SCHEMA })
export class SubscriptionLifecycleEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType!: SubscriptionLifecycleEventType;

  @Column({ name: 'days_before', type: 'int', nullable: true })
  daysBefore?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
