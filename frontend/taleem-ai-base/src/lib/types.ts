export const TenantStatus = {
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  RETIRED: 'RETIRED',
} as const
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus]

export const DeploymentModel = {
  SAAS: 'SAAS',
  ON_PREMISES: 'ON_PREMISES',
} as const
export type DeploymentModel = (typeof DeploymentModel)[keyof typeof DeploymentModel]

export const ContactType = {
  PRIMARY: 'PRIMARY',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  TECHNICAL: 'TECHNICAL',
  FINANCE: 'FINANCE',
  ACADEMIC: 'ACADEMIC',
  OTHER: 'OTHER',
} as const
export type ContactType = (typeof ContactType)[keyof typeof ContactType]

export const AddressType = {
  HEAD_OFFICE: 'HEAD_OFFICE',
  CAMPUS: 'CAMPUS',
  BRANCH: 'BRANCH',
  MAILING: 'MAILING',
  BILLING: 'BILLING',
} as const
export type AddressType = (typeof AddressType)[keyof typeof AddressType]

export const IdentifierType = {
  REGISTRATION: 'REGISTRATION',
  TAX: 'TAX',
  ACCREDITATION: 'ACCREDITATION',
  LICENSE: 'LICENSE',
  OTHER: 'OTHER',
} as const
export type IdentifierType = (typeof IdentifierType)[keyof typeof IdentifierType]

export const AssetType = {
  LOGO: 'LOGO',
  LOGO_DARK: 'LOGO_DARK',
  FAVICON: 'FAVICON',
  BANNER: 'BANNER',
  DOCUMENT: 'DOCUMENT',
} as const
export type AssetType = (typeof AssetType)[keyof typeof AssetType]

export const CampusType = {
  MAIN_CAMPUS: 'MAIN_CAMPUS',
  SUB_CAMPUS: 'SUB_CAMPUS',
  BRANCH: 'BRANCH',
} as const
export type CampusType = (typeof CampusType)[keyof typeof CampusType]

export const SmtpEncryption = {
  TLS: 'TLS',
  SSL: 'SSL',
  NONE: 'NONE',
} as const
export type SmtpEncryption = (typeof SmtpEncryption)[keyof typeof SmtpEncryption]

export const PlanType = {
  TRIAL: 'TRIAL',
  FREE: 'FREE',
  PAID: 'PAID',
} as const
export type PlanType = (typeof PlanType)[keyof typeof PlanType]

export const BillingCycle = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const
export type BillingCycle = (typeof BillingCycle)[keyof typeof BillingCycle]

export const ApplicationStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const EntitlementStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type EntitlementStatus = (typeof EntitlementStatus)[keyof typeof EntitlementStatus]

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus]

export const UserStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const TenantUserRole = {
  TENANT_ADMIN: 'TENANT_ADMIN',
  TENANT_USER: 'TENANT_USER',
} as const
export type TenantUserRole = (typeof TenantUserRole)[keyof typeof TenantUserRole]

export type Role = 'PLATFORM_ADMIN' | 'TENANT_ADMIN'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  roles: string[]
  permissions: string[]
}

export type UserTenantMembership = {
  membershipId: string
  tenantId: string
  tenantCode: string
  tenantDisplayName: string
  tenantStatus: string
  membershipStatus: string
  role: string
  joinedAt: string
  isTenantAdmin: boolean
}

export type Session = {
  accessToken: string
  user: AuthUser
  memberships?: UserTenantMembership[]
  tenantId?: string
}

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type Paginated<T> = {
  data: T[]
  meta: PaginationMeta
}

export type Tenant = {
  id: string
  tenantCode: string
  legalName: string
  displayName: string
  institutionType: string
  websiteUrl?: string
  status: TenantStatus
  deploymentModel: DeploymentModel
  countryCode: string
  provinceCode?: string
  city?: string
  activatedAt?: string
  suspendedAt?: string
  retiredAt?: string
  createdAt: string
  updatedAt: string
}

export type InstitutionProfile = {
  id?: string
  tenantId: string
  legalName: string
  displayName: string
  registrationNumber?: string
  campusType?: CampusType
  institutionType?: string
  website?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  stateProvince?: string
  postalCode?: string
  countryCode?: string
}

export type TenantContact = {
  id: string
  tenantId: string
  contactType: ContactType
  firstName: string
  middleName?: string
  lastName?: string
  designation?: string
  department?: string
  responsibility?: string
  email?: string
  mobilePhone?: string
  landlinePhone?: string
  whatsappNumber?: string
  isPrimary: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type TenantAddress = {
  id: string
  tenantId: string
  addressType: AddressType
  addressLine1: string
  addressLine2?: string
  area?: string
  city: string
  district?: string
  provinceCode?: string
  postalCode?: string
  countryCode: string
  isPrimary: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type TenantIdentifier = {
  id: string
  tenantId: string
  identifierType: string
  identifierValue: string
  issuingAuthority?: string
  issueDate?: string
  expiryDate?: string
  isVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  createdAt?: string
  updatedAt?: string
}

export type TenantConfiguration = {
  id: string
  tenantId: string
  timezone: string
  locale: string
  dateFormat?: string
  currencyCode: string
  brandingName?: string
  logoAssetId?: string
  logoDarkAssetId?: string
  faviconAssetId?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  emailFromName?: string
  emailFromAddress?: string
  supportEmail?: string
  createdAt: string
  updatedAt: string
}

export type TenantSmtp = {
  id: string
  tenantId: string
  host: string
  port: number
  username?: string
  passwordSecretRef?: string
  encryption: SmtpEncryption
  fromName?: string
  fromEmail?: string
  replyToEmail?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TenantAsset = {
  id: string
  tenantId: string
  assetType: AssetType
  fileUrl: string
  fileName?: string
  contentType?: string
  createdAt: string
}

export type TenantBranding = {
  tenantId: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  emailFromName?: string
  supportEmail?: string
}

export type CatalogApplication = {
  id: string
  applicationCode: string
  name: string
  description?: string
  version?: string
  status: ApplicationStatus
  launchUrl?: string
}

export type Subscription = {
  id: string
  tenantId: string
  subscriptionCode: string
  status: SubscriptionStatus
  planType: PlanType
  billingCycle?: BillingCycle
  applicationCodes: string[]
  startDate: string
  endDate: string
  createdAt?: string
  updatedAt?: string
}

export type Entitlement = {
  id: string
  tenantId: string
  applicationId?: string
  applicationCode?: string
  applicationName?: string
  subscriptionId?: string
  status: EntitlementStatus
  effectiveFrom: string
  effectiveUntil?: string
  createdAt?: string
  updatedAt?: string
}

export const MembershipRole = {
  TENANT_ADMIN: 'TENANT_ADMIN',
  TENANT_MEMBER: 'TENANT_MEMBER',
} as const
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole]

export const MembershipStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus]

export type TenantMembership = {
  id: string
  tenantId: string
  userId: string
  status: MembershipStatus
  role: MembershipRole
  joinedAt: string
  createdAt: string
  updatedAt: string
  userEmail: string
  userFullName: string
  isTenantAdmin: boolean
}

export type AdminInvitation = {
  id: string
  tenantId: string
  email: string
  role: MembershipRole
  status: InvitationStatus
  expiresAt: string
  acceptedAt?: string
  invitedBy: string
  createdAt: string
  invitationToken?: string
}

export type TenantUser = {
  id: string
  tenantId: string
  fullName: string
  email: string
  role: TenantUserRole
  status: UserStatus
  assignedApps: string[]
}

export type AuditEvent = {
  id: string
  tenantName?: string
  actor: string
  action: string
  entity: string
  at: string
}

export type AvailableApplication = {
  applicationId: string
  applicationCode: string
  name: string
  launchUrl?: string
  entitlementId: string
  effectiveFrom: string
  effectiveUntil?: string
  subscriptionId?: string
}
