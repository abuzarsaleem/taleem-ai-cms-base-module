import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';

@Entity({ name: 'tenant_contacts', schema: DATABASE_SCHEMA })
export class TenantContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'contact_type', type: 'varchar', length: 50 })
  contactType!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  designation?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  responsibility?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'mobile_phone', type: 'varchar', length: 30, nullable: true })
  mobilePhone?: string;

  @Column({ name: 'landline_phone', type: 'varchar', length: 30, nullable: true })
  landlinePhone?: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'tenant_addresses', schema: DATABASE_SCHEMA })
export class TenantAddressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'address_type', type: 'varchar', length: 30 })
  addressType!: string;

  @Column({ name: 'address_line_1', type: 'varchar', length: 255 })
  addressLine1!: string;

  @Column({ name: 'address_line_2', type: 'varchar', length: 255, nullable: true })
  addressLine2?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  area?: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district?: string;

  @Column({ name: 'province_code', type: 'varchar', length: 20, nullable: true })
  provinceCode?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ name: 'country_code', type: 'char', length: 2, default: 'PK' })
  countryCode!: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'tenant_identifiers', schema: DATABASE_SCHEMA })
export class TenantIdentifierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'identifier_type', type: 'varchar', length: 50 })
  identifierType!: string;

  @Column({ name: 'identifier_value', type: 'varchar', length: 150 })
  identifierValue!: string;

  @Column({ name: 'issuing_authority', type: 'varchar', length: 150, nullable: true })
  issuingAuthority?: string;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate?: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'tenant_configurations', schema: DATABASE_SCHEMA })
export class TenantConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ type: 'varchar', length: 100, default: 'Asia/Karachi' })
  timezone!: string;

  @Column({ type: 'varchar', length: 20, default: 'en-PK' })
  locale!: string;

  @Column({ name: 'date_format', type: 'varchar', length: 30, nullable: true })
  dateFormat?: string;

  @Column({ name: 'currency_code', type: 'char', length: 3, default: 'PKR' })
  currencyCode!: string;

  @Column({ name: 'branding_name', type: 'varchar', length: 255, nullable: true })
  brandingName?: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'tenant_smtp_configurations', schema: DATABASE_SCHEMA })
export class TenantSmtpConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  host!: string;

  @Column({ type: 'smallint', default: 587 })
  port!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username?: string;

  @Column({ name: 'password_secret_ref', type: 'varchar', length: 500, nullable: true })
  passwordSecretRef?: string;

  @Column({ type: 'varchar', length: 20, default: 'TLS' })
  encryption!: string;

  @Column({ name: 'from_name', type: 'varchar', length: 255, nullable: true })
  fromName?: string;

  @Column({ name: 'from_email', type: 'varchar', length: 255, nullable: true })
  fromEmail?: string;

  @Column({ name: 'reply_to_email', type: 'varchar', length: 255, nullable: true })
  replyToEmail?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'tenant_assets', schema: DATABASE_SCHEMA })
export class TenantAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 50 })
  assetType!: string;

  @Column({ name: 'file_url', type: 'varchar', length: 1000 })
  fileUrl!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName?: string;

  @Column({ name: 'content_type', type: 'varchar', length: 100, nullable: true })
  contentType?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'institution_profiles', schema: DATABASE_SCHEMA })
export class InstitutionProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber?: string;

  @Column({ name: 'campus_type', type: 'varchar', length: 100, nullable: true })
  campusType?: string;

  @Column({ name: 'institution_type', type: 'varchar', length: 50, nullable: true })
  institutionType?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website?: string;

  @Column({ name: 'address_line_1', type: 'varchar', length: 255, nullable: true })
  addressLine1?: string;

  @Column({ name: 'address_line_2', type: 'varchar', length: 255, nullable: true })
  addressLine2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'state_province', type: 'varchar', length: 100, nullable: true })
  stateProvince?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 30, nullable: true })
  postalCode?: string;

  @Column({ name: 'country_code', type: 'varchar', length: 10, nullable: true })
  countryCode?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'tenant_branding', schema: DATABASE_SCHEMA })
export class TenantBrandingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ name: 'logo_asset_id', type: 'uuid', nullable: true })
  logoAssetId?: string;

  @Column({ name: 'logo_dark_asset_id', type: 'uuid', nullable: true })
  logoDarkAssetId?: string;

  @Column({ name: 'favicon_asset_id', type: 'uuid', nullable: true })
  faviconAssetId?: string;

  @Column({ name: 'primary_color', type: 'char', length: 7, nullable: true })
  primaryColor?: string;

  @Column({ name: 'secondary_color', type: 'char', length: 7, nullable: true })
  secondaryColor?: string;

  @Column({ name: 'accent_color', type: 'char', length: 7, nullable: true })
  accentColor?: string;

  @Column({ name: 'font_family', type: 'text', nullable: true })
  fontFamily?: string;

  @Column({ name: 'email_from_name', type: 'text', nullable: true })
  emailFromName?: string;

  @Column({ name: 'email_from_address', type: 'varchar', nullable: true })
  emailFromAddress?: string;

  @Column({ name: 'support_email', type: 'varchar', nullable: true })
  supportEmail?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
