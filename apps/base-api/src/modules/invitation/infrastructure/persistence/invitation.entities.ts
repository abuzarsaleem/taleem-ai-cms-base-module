import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';

@Entity({ name: 'tenant_memberships', schema: DATABASE_SCHEMA })
export class TenantMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId!: string;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status!: string;

  @Column({ type: 'varchar', length: 30, default: 'TENANT_MEMBER' })
  role!: string;

  @Column({ name: 'joined_at', type: 'timestamptz', default: () => 'now()' })
  joinedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
