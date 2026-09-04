import { TenantProps } from './tenant.types.js';

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

export interface ITenantRepository {
  findById(id: string): Promise<TenantProps | null>;
  findByCode(tenantCode: string): Promise<TenantProps | null>;
  findAll(page: number, limit: number): Promise<{ data: TenantProps[]; total: number }>;
  create(props: TenantProps): Promise<TenantProps>;
  update(id: string, props: Partial<TenantProps>): Promise<TenantProps>;
  delete(id: string): Promise<void>;
}

export const TENANT_CONTACT_REPOSITORY = Symbol('TENANT_CONTACT_REPOSITORY');
export const TENANT_ADDRESS_REPOSITORY = Symbol('TENANT_ADDRESS_REPOSITORY');
export const TENANT_IDENTIFIER_REPOSITORY = Symbol('TENANT_IDENTIFIER_REPOSITORY');
export const TENANT_CONFIGURATION_REPOSITORY = Symbol('TENANT_CONFIGURATION_REPOSITORY');
export const TENANT_SMTP_REPOSITORY = Symbol('TENANT_SMTP_REPOSITORY');
export const TENANT_ASSET_REPOSITORY = Symbol('TENANT_ASSET_REPOSITORY');
export const INSTITUTION_PROFILE_REPOSITORY = Symbol('INSTITUTION_PROFILE_REPOSITORY');
export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');
export const DESIGNATION_REPOSITORY = Symbol('DESIGNATION_REPOSITORY');
export const IDENTIFIER_TYPE_REPOSITORY = Symbol('IDENTIFIER_TYPE_REPOSITORY');

export interface CatalogItemProps {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
}

export interface ICatalogRepository {
  findActive(): Promise<CatalogItemProps[]>;
  findActiveByCode(code: string): Promise<CatalogItemProps | null>;
}

export interface TenantContactProps {
  id?: string;
  tenantId: string;
  contactType: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  designation?: string;
  department?: string;
  responsibility?: string;
  email?: string;
  mobilePhone?: string;
  landlinePhone?: string;
  whatsappNumber?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantAddressProps {
  id?: string;
  tenantId: string;
  addressType: string;
  addressLine1: string;
  addressLine2?: string;
  area?: string;
  city: string;
  district?: string;
  provinceCode?: string;
  postalCode?: string;
  countryCode?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantIdentifierProps {
  id?: string;
  tenantId: string;
  identifierType: string;
  identifierValue: string;
  issuingAuthority?: string;
  issueDate?: Date;
  expiryDate?: Date;
  isVerified?: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantConfigurationProps {
  id?: string;
  tenantId: string;
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  currencyCode?: string;
  brandingName?: string;
  logoUrl?: string;
  logoAssetId?: string;
  logoDarkAssetId?: string;
  faviconAssetId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  supportEmail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantSmtpConfigurationProps {
  id?: string;
  tenantId: string;
  host: string;
  port?: number;
  username?: string;
  passwordSecretRef?: string;
  encryption?: string;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantAssetProps {
  id?: string;
  tenantId: string;
  assetType: string;
  fileUrl: string;
  fileName?: string;
  contentType?: string;
  createdAt?: Date;
}

export interface InstitutionProfileProps {
  id?: string;
  tenantId: string;
  legalName: string;
  displayName: string;
  registrationNumber?: string;
  campusType?: string;
  institutionType?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  countryCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITenantContactRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      contactType?: string;
      email?: string;
      search?: string;
      isActive?: boolean;
      isPrimary?: boolean;
    },
  ): Promise<{ data: TenantContactProps[]; total: number }>;
  findByTenant(tenantId: string, page: number, limit: number): Promise<{ data: TenantContactProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantContactProps | null>;
  create(props: TenantContactProps): Promise<TenantContactProps>;
  update(tenantId: string, id: string, props: Partial<TenantContactProps>): Promise<TenantContactProps>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface ITenantAddressRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      addressType?: string;
      city?: string;
      countryCode?: string;
      isActive?: boolean;
    },
  ): Promise<{ data: TenantAddressProps[]; total: number }>;
  findByTenant(tenantId: string, page: number, limit: number): Promise<{ data: TenantAddressProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantAddressProps | null>;
  create(props: TenantAddressProps): Promise<TenantAddressProps>;
  update(tenantId: string, id: string, props: Partial<TenantAddressProps>): Promise<TenantAddressProps>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface ITenantIdentifierRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      identifierType?: string;
      identifierValue?: string;
      isVerified?: boolean;
    },
  ): Promise<{ data: TenantIdentifierProps[]; total: number }>;
  findByTenant(tenantId: string, page: number, limit: number): Promise<{ data: TenantIdentifierProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantIdentifierProps | null>;
  create(props: TenantIdentifierProps): Promise<TenantIdentifierProps>;
  update(tenantId: string, id: string, props: Partial<TenantIdentifierProps>): Promise<TenantIdentifierProps>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface ITenantConfigurationRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      timezone?: string;
      locale?: string;
      currencyCode?: string;
    },
  ): Promise<{ data: TenantConfigurationProps[]; total: number }>;
  findByTenantId(tenantId: string): Promise<TenantConfigurationProps | null>;
  create(props: TenantConfigurationProps): Promise<TenantConfigurationProps>;
  update(tenantId: string, props: Partial<TenantConfigurationProps>): Promise<TenantConfigurationProps>;
  delete(tenantId: string): Promise<void>;
}

export interface ITenantSmtpRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      host?: string;
      isActive?: boolean;
    },
  ): Promise<{ data: TenantSmtpConfigurationProps[]; total: number }>;
  findByTenantId(tenantId: string): Promise<TenantSmtpConfigurationProps | null>;
  create(props: TenantSmtpConfigurationProps): Promise<TenantSmtpConfigurationProps>;
  update(tenantId: string, props: Partial<TenantSmtpConfigurationProps>): Promise<TenantSmtpConfigurationProps>;
  delete(tenantId: string): Promise<void>;
}

export interface ITenantAssetRepository {
  findAll(
    page: number,
    limit: number,
    filters?: {
      tenantId?: string;
      assetType?: string;
    },
  ): Promise<{ data: TenantAssetProps[]; total: number }>;
  findByTenant(tenantId: string, page: number, limit: number): Promise<{ data: TenantAssetProps[]; total: number }>;
  findById(tenantId: string, id: string): Promise<TenantAssetProps | null>;
  create(props: TenantAssetProps): Promise<TenantAssetProps>;
  update(tenantId: string, id: string, props: Partial<TenantAssetProps>): Promise<TenantAssetProps>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface IInstitutionProfileRepository {
  findByTenantId(tenantId: string): Promise<InstitutionProfileProps | null>;
  create(props: InstitutionProfileProps): Promise<InstitutionProfileProps>;
  update(tenantId: string, props: Partial<InstitutionProfileProps>): Promise<InstitutionProfileProps>;
  delete(tenantId: string): Promise<void>;
}
