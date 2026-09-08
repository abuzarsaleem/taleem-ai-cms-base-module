import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';

export enum ApplicationAccessStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

export enum RoleType {
  SYSTEM = 'SYSTEM',
  CUSTOM = 'CUSTOM',
}

@Entity({ name: 'application_permissions', schema: DATABASE_SCHEMA })
export class ApplicationPermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @Column({ name: 'permission_code', type: 'varchar', length: 100 })
  permissionCode!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'application_access_assignments', schema: DATABASE_SCHEMA })
export class ApplicationAccessAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'identity_id', type: 'uuid' })
  identityId!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ type: 'varchar', length: 30, default: ApplicationAccessStatus.ACTIVE })
  status!: ApplicationAccessStatus;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;
}
