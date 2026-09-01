export enum TenantStatus {
  ONBOARDING = 'ONBOARDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  RETIRED = 'RETIRED',
}

export enum DeploymentModel {
  SAAS = 'SAAS',
  ON_PREMISES = 'ON_PREMISES',
}

export enum ContactType {
  PRIMARY = 'PRIMARY',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  TECHNICAL = 'TECHNICAL',
  FINANCE = 'FINANCE',
  ACADEMIC = 'ACADEMIC',
  OTHER = 'OTHER',
}

export enum AddressType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  CAMPUS = 'CAMPUS',
  BRANCH = 'BRANCH',
  MAILING = 'MAILING',
  BILLING = 'BILLING',
}

export enum IdentifierType {
  REGISTRATION = 'REGISTRATION',
  TAX = 'TAX',
  ACCREDITATION = 'ACCREDITATION',
  LICENSE = 'LICENSE',
  OTHER = 'OTHER',
}

export enum AssetType {
  LOGO = 'LOGO',
  LOGO_DARK = 'LOGO_DARK',
  FAVICON = 'FAVICON',
  BANNER = 'BANNER',
  DOCUMENT = 'DOCUMENT',
}

export enum CampusType {
  MAIN_CAMPUS = 'MAIN_CAMPUS',
  SUB_CAMPUS = 'SUB_CAMPUS',
  BRANCH = 'BRANCH',
}

export enum SmtpEncryption {
  TLS = 'TLS',
  SSL = 'SSL',
  NONE = 'NONE',
}

export interface TenantProps {
  id?: string;
  tenantCode: string;
  legalName: string;
  displayName: string;
  institutionType: string;
  websiteUrl?: string;
  status?: TenantStatus;
  deploymentModel?: DeploymentModel;
  countryCode?: string;
  provinceCode?: string;
  city?: string;
  activatedAt?: Date;
  suspendedAt?: Date;
  retiredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
