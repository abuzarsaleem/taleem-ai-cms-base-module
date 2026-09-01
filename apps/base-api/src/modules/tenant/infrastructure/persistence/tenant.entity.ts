import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import { DeploymentModel, TenantStatus } from '../../domain/tenant.types.js';

@Entity({ name: 'tenants', schema: DATABASE_SCHEMA })
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_code', type: 'varchar', length: 50, unique: true })
  tenantCode!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ name: 'institution_type', type: 'varchar', length: 50 })
  institutionType!: string;

  @Column({ name: 'website_url', type: 'varchar', length: 500, nullable: true })
  websiteUrl?: string;

  @Column({ type: 'varchar', length: 30, default: TenantStatus.ONBOARDING })
  status!: TenantStatus;

  @Column({ name: 'deployment_model', type: 'varchar', length: 30, default: DeploymentModel.SAAS })
  deploymentModel!: DeploymentModel;

  @Column({ name: 'country_code', type: 'char', length: 2, default: 'PK' })
  countryCode!: string;

  @Column({ name: 'province_code', type: 'varchar', length: 20, nullable: true })
  provinceCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'activated_at', type: 'timestamptz', nullable: true })
  activatedAt?: Date;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt?: Date;

  @Column({ name: 'retired_at', type: 'timestamptz', nullable: true })
  retiredAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
