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
  emailVerified?: boolean
  avatarUrl?: string
  status?: string
}

export type AuthTokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: string
  refreshExpiresIn: string
  user: {
    id: string
    email: string
    fullName: string
    emailVerified?: boolean
    avatarUrl?: string
    roles: string[]
    permissions?: string[]
  }
}

export type UserProfile = {
  id: string
  email: string
  fullName: string
  emailVerified: boolean
  status: string
  avatarUrl?: string
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
  refreshToken?: string
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
  applicationCount?: number
  logoUrl?: string
  logoDarkUrl?: string
  createdAt: string
  updatedAt: string
  applications?: AvailableApplication[]
}

export type TenantCatalogueStats = {
  total: number
  active: number
  onboarding: number
  suspended: number
  retired: number
  vsPreviousMonth: {
    total: number
    active: number
    onboarding: number
    suspended: number
    retired: number
  }
}

export type TenantListResponse = Paginated<Tenant> & {
  stats: TenantCatalogueStats
}

export type TenantListQuery = {
  page?: number
  limit?: number
  search?: string
  status?: TenantStatus
  institutionType?: string
  deploymentModel?: DeploymentModel
  tenantCode?: string
  countryCode?: string
  city?: string
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

export const TenantSetupProgressStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETE: 'COMPLETE',
} as const
export type TenantSetupProgressStatus =
  (typeof TenantSetupProgressStatus)[keyof typeof TenantSetupProgressStatus]

export type TenantConfigurationChecklist = {
  identifier: boolean
  primaryContact: boolean
  smtp: boolean
  address: boolean
}

export type PlatformConfigurationRow = {
  id?: string
  tenantId: string
  tenantCode?: string
  displayName?: string
  websiteUrl?: string
  tenantStatus?: TenantStatus | string
  timezone?: string
  locale?: string
  dateFormat?: string
  currencyCode?: string
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
  checklist?: TenantConfigurationChecklist
  completedCount?: number
  requiredCount?: number
  percent?: number
  progressStatus?: TenantSetupProgressStatus | string
  missing?: Array<'identifier' | 'primaryContact' | 'smtp' | 'address'>
  createdAt?: string
  updatedAt?: string
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
  logoUrl?: string
  tenantCount?: number
  createdAt?: string
  updatedAt?: string
}

export type ApplicationCatalogueStats = {
  total: number
  active: number
  inactive: number
  vsPreviousMonth: {
    total: number
    active: number
    inactive: number
  }
  latestVersion?: {
    name: string
    applicationCode: string
    version: string
  }
}

export type ApplicationListResponse = Paginated<CatalogApplication> & {
  stats: ApplicationCatalogueStats
}

export type ApplicationRole = {
  id: string
  roleCode: string
  roleName: string
  description?: string
  applicationId: string
  roleType: string
  permissionCodes: string[]
}

export type ApplicationPermission = {
  id: string
  applicationId: string
  permissionCode: string
  name: string
  description?: string
}

export const OAuthClientType = {
  PUBLIC: 'PUBLIC',
  CONFIDENTIAL: 'CONFIDENTIAL',
} as const
export type OAuthClientType = (typeof OAuthClientType)[keyof typeof OAuthClientType]

export type OAuthClient = {
  id: string
  applicationId: string
  clientId: string
  clientName: string
  clientType: OAuthClientType | string
  status: string
  redirectUris: string[]
}

export type CreateOAuthClientResponse = OAuthClient & {
  clientSecret?: string
}

export type SubscriptionApplicationItem = {
  applicationCode: string
  launchUrl?: string
  maxUsers?: number
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
  launchUrl?: string
  maxUsers?: number | null
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

export type PlatformTenantAdminApplication = {
  applicationId: string
  applicationCode: string
  applicationName: string
  roleCode?: string
  roleName?: string
  status: string
}

export type PlatformTenantAdmin = {
  id: string
  tenantId: string
  tenantCode: string
  tenantDisplayName: string
  userId: string
  userEmail: string
  userFullName: string
  status: MembershipStatus | string
  role: MembershipRole | string
  isTenantAdmin: boolean
  createdAt: string
  joinedAt: string
  applications: PlatformTenantAdminApplication[]
}

export type ProvisionTenantAdminMode = 'INVITE' | 'CREATE'

export type ProvisionTenantAdminApplication = {
  applicationId: string
  roleId: string
  isDefault?: boolean
}

export type ProvisionTenantAdminBody = {
  mode: ProvisionTenantAdminMode
  email: string
  fullName?: string
  password?: string
  applications?: ProvisionTenantAdminApplication[]
}

export type ProvisionTenantAdminResult = {
  status: 'INVITED' | 'CREATED'
  invitation?: AdminInvitation & { invitationToken?: string }
  membership?: TenantMembership
  applicationAccess?: Array<{
    id: string
    applicationId: string
    applicationCode?: string
    applicationName?: string
    roleId: string
    roleCode?: string
    roleName?: string
  }>
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
  logoUrl?: string
  entitlementId: string
  effectiveFrom: string
  effectiveUntil?: string
  subscriptionId?: string
}

export type PlatformDashboardCountMetric = {
  value: number
  vsPreviousMonth: number
}

export type PlatformDashboardCounts = {
  tenants: PlatformDashboardCountMetric
  activeTenants: PlatformDashboardCountMetric
  onboarding: PlatformDashboardCountMetric
  applications: PlatformDashboardCountMetric
}

export type PlatformDashboardAttentionItem = {
  key: string
  label: string
  count: number
}

export type PlatformDashboardAttention = {
  items: PlatformDashboardAttentionItem[]
  total: number
}

export type PlatformDashboardRecentTenant = {
  id: string
  displayName: string
  tenantCode: string
  status: TenantStatus | string
  joinedAt: string
  logoUrl?: string
  logoDarkUrl?: string
}

export type PlatformDashboardActivityItem = {
  id: string
  action: string
  summary: string
  tenantId?: string
  actorUserId?: string
  entityType?: string
  entityId?: string
  createdAt: string
}

export const PlatformComponentStatus = {
  OPERATIONAL: 'OPERATIONAL',
  DEGRADED: 'DEGRADED',
  DOWN: 'DOWN',
  UNKNOWN: 'UNKNOWN',
} as const
export type PlatformComponentStatus =
  (typeof PlatformComponentStatus)[keyof typeof PlatformComponentStatus]

export type PlatformDashboardSystemComponent = {
  key: string
  label: string
  status: PlatformComponentStatus
  detail?: string
}

export type PlatformDashboardSystemStatus = {
  overall: PlatformComponentStatus
  components: PlatformDashboardSystemComponent[]
  checkedAt: string
}
