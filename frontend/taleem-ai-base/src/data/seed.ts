import {
  AddressType,
  ApplicationStatus,
  CampusType,
  ContactType,
  DeploymentModel,
  EntitlementStatus,
  IdentifierType,
  InvitationStatus,
  BillingCycle,
  PlanType,
  SmtpEncryption,
  SubscriptionStatus,
  TenantStatus,
  TenantUserRole,
  UserStatus,
  type AdminInvitation,
  type AuditEvent,
  type CatalogApplication,
  type Entitlement,
  type InstitutionProfile,
  type Subscription,
  type Tenant,
  type TenantAddress,
  type TenantBranding,
  type TenantConfiguration,
  type TenantContact,
  type TenantIdentifier,
  type TenantSmtp,
  type TenantUser,
} from '@/lib/types'

export const applications: CatalogApplication[] = [
  {
    id: 'app_alumni',
    applicationCode: 'ALUMNI',
    name: 'Alumni Network',
    description: 'Alumni directory, engagement, and institutional network.',
    version: '1.2.0',
    status: ApplicationStatus.ACTIVE,
    launchUrl: 'https://alumni.taleem.ai',
  },
  {
    id: 'app_admissions',
    applicationCode: 'ADMISSIONS',
    name: 'Admissions',
    description: 'Applications, offers, and enrolment operations.',
    version: '1.0.4',
    status: ApplicationStatus.ACTIVE,
    launchUrl: 'https://admissions.taleem.ai',
  },
  {
    id: 'app_academics',
    applicationCode: 'ACADEMICS',
    name: 'Academics',
    description: 'Programmes, courses, and academic administration.',
    version: '0.9.1',
    status: ApplicationStatus.ACTIVE,
    launchUrl: 'https://academics.taleem.ai',
  },
]

export const tenants: Tenant[] = [
  {
    id: 'tnt_uol',
    tenantCode: 'uol-lahore',
    legalName: 'University of Lahore (Private) Limited',
    displayName: 'University of Lahore',
    institutionType: 'UNIVERSITY',
    websiteUrl: 'https://uol.edu.pk',
    status: TenantStatus.ACTIVE,
    deploymentModel: DeploymentModel.SAAS,
    countryCode: 'PK',
    provinceCode: 'PB',
    city: 'Lahore',
    activatedAt: '2026-03-12',
    createdAt: '2026-03-10',
  },
  {
    id: 'tnt_lums',
    tenantCode: 'lums',
    legalName: 'Lahore University of Management Sciences',
    displayName: 'LUMS',
    institutionType: 'UNIVERSITY',
    websiteUrl: 'https://lums.edu.pk',
    status: TenantStatus.ONBOARDING,
    deploymentModel: DeploymentModel.SAAS,
    countryCode: 'PK',
    provinceCode: 'PB',
    city: 'Lahore',
    createdAt: '2026-08-28',
  },
  {
    id: 'tnt_aku',
    tenantCode: 'aku',
    legalName: 'Aga Khan University',
    displayName: 'Aga Khan University',
    institutionType: 'UNIVERSITY',
    websiteUrl: 'https://aku.edu',
    status: TenantStatus.SUSPENDED,
    deploymentModel: DeploymentModel.SAAS,
    countryCode: 'PK',
    provinceCode: 'SD',
    city: 'Karachi',
    activatedAt: '2025-11-02',
    createdAt: '2025-10-20',
  },
]

export const profiles: InstitutionProfile[] = [
  {
    tenantId: 'tnt_uol',
    legalName: 'University of Lahore (Private) Limited',
    displayName: 'University of Lahore',
    registrationNumber: 'REG-12345-2020',
    campusType: CampusType.MAIN_CAMPUS,
    institutionType: 'UNIVERSITY',
    website: 'https://uol.edu.pk',
    addressLine1: '1-KM Defence Road',
    city: 'Lahore',
    stateProvince: 'Punjab',
    postalCode: '54000',
    countryCode: 'PK',
  },
  {
    tenantId: 'tnt_lums',
    legalName: 'Lahore University of Management Sciences',
    displayName: 'LUMS',
    institutionType: 'UNIVERSITY',
    city: 'Lahore',
    countryCode: 'PK',
  },
  {
    tenantId: 'tnt_aku',
    legalName: 'Aga Khan University',
    displayName: 'Aga Khan University',
    campusType: CampusType.MAIN_CAMPUS,
    institutionType: 'UNIVERSITY',
    website: 'https://aku.edu',
    city: 'Karachi',
    countryCode: 'PK',
  },
]

export const contacts: TenantContact[] = [
  {
    id: 'ctc_uol_1',
    tenantId: 'tnt_uol',
    contactType: ContactType.PRIMARY,
    firstName: 'Farah',
    lastName: 'Malik',
    designation: 'Registrar',
    department: 'Academics',
    email: 'farah.malik@uol.edu.pk',
    mobilePhone: '+923001112233',
    isPrimary: true,
    isActive: true,
  },
  {
    id: 'ctc_lums_1',
    tenantId: 'tnt_lums',
    contactType: ContactType.ADMINISTRATIVE,
    firstName: 'Imran',
    lastName: 'Qureshi',
    designation: 'IT Director',
    email: 'imran.qureshi@lums.edu.pk',
    isPrimary: true,
    isActive: true,
  },
]

export const addresses: TenantAddress[] = [
  {
    id: 'adr_uol_1',
    tenantId: 'tnt_uol',
    addressType: AddressType.HEAD_OFFICE,
    addressLine1: '1-KM Defence Road',
    city: 'Lahore',
    provinceCode: 'PB',
    postalCode: '54000',
    countryCode: 'PK',
    isPrimary: true,
  },
]

export const identifiers: TenantIdentifier[] = [
  {
    id: 'idn_uol_1',
    tenantId: 'tnt_uol',
    identifierType: IdentifierType.REGISTRATION,
    identifierValue: 'REG-12345-2020',
    issuingAuthority: 'SECP',
  },
  {
    id: 'idn_uol_2',
    tenantId: 'tnt_uol',
    identifierType: IdentifierType.ACCREDITATION,
    identifierValue: 'HEC-UNI-014',
    issuingAuthority: 'HEC',
  },
]

export const configurations: TenantConfiguration[] = [
  {
    tenantId: 'tnt_uol',
    timezone: 'Asia/Karachi',
    locale: 'en-PK',
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'PKR',
  },
  {
    tenantId: 'tnt_lums',
    timezone: 'Asia/Karachi',
    locale: 'en-PK',
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'PKR',
  },
]

export const smtp: TenantSmtp[] = [
  {
    tenantId: 'tnt_uol',
    host: 'smtp.uol.edu.pk',
    port: 587,
    username: 'noreply@uol.edu.pk',
    encryption: SmtpEncryption.TLS,
    fromName: 'University of Lahore',
    fromEmail: 'noreply@uol.edu.pk',
    isActive: true,
  },
]

export const branding: TenantBranding[] = [
  {
    tenantId: 'tnt_uol',
    primaryColor: '#081B45',
    secondaryColor: '#FFFFFF',
    accentColor: '#36BABC',
    emailFromName: 'University of Lahore',
    supportEmail: 'it-support@uol.edu.pk',
  },
]

export const subscriptions: Subscription[] = [
  {
    id: 'sub_uol_1',
    tenantId: 'tnt_uol',
    subscriptionCode: 'uol-lahore-20260312',
    status: SubscriptionStatus.ACTIVE,
    planType: PlanType.PAID,
    billingCycle: BillingCycle.YEARLY,
    applicationCodes: ['ALUMNI', 'ADMISSIONS'],
    startDate: '2026-03-12',
    endDate: '2027-03-11',
  },
  {
    id: 'sub_aku_1',
    tenantId: 'tnt_aku',
    subscriptionCode: 'aku-20251102',
    status: SubscriptionStatus.INACTIVE,
    planType: PlanType.PAID,
    billingCycle: BillingCycle.YEARLY,
    applicationCodes: ['ALUMNI'],
    startDate: '2025-11-02',
    endDate: '2026-08-01',
  },
]

export const entitlements: Entitlement[] = [
  {
    id: 'ent_uol_alumni',
    tenantId: 'tnt_uol',
    applicationCode: 'ALUMNI',
    subscriptionId: 'sub_uol_1',
    status: EntitlementStatus.ACTIVE,
    effectiveFrom: '2026-03-12',
    effectiveUntil: '2027-03-11',
  },
  {
    id: 'ent_uol_admissions',
    tenantId: 'tnt_uol',
    applicationCode: 'ADMISSIONS',
    subscriptionId: 'sub_uol_1',
    status: EntitlementStatus.ACTIVE,
    effectiveFrom: '2026-03-12',
    effectiveUntil: '2027-03-11',
  },
  {
    id: 'ent_aku_alumni',
    tenantId: 'tnt_aku',
    applicationCode: 'ALUMNI',
    subscriptionId: 'sub_aku_1',
    status: EntitlementStatus.INACTIVE,
    effectiveFrom: '2025-11-02',
    effectiveUntil: '2026-08-01',
  },
]

export const invitations: AdminInvitation[] = [
  {
    id: 'inv_uol_1',
    tenantId: 'tnt_uol',
    email: 'farah.malik@uol.edu.pk',
    status: InvitationStatus.ACCEPTED,
    expiresAt: '2026-03-17',
    invitedBy: 'Platform Admin',
  },
  {
    id: 'inv_lums_1',
    tenantId: 'tnt_lums',
    email: 'imran.qureshi@lums.edu.pk',
    status: InvitationStatus.PENDING,
    expiresAt: '2026-09-10',
    invitedBy: 'Platform Admin',
  },
]

export const users: TenantUser[] = [
  {
    id: 'usr_uol_1',
    tenantId: 'tnt_uol',
    fullName: 'Farah Malik',
    email: 'farah.malik@uol.edu.pk',
    role: TenantUserRole.TENANT_ADMIN,
    status: UserStatus.ACTIVE,
    assignedApps: ['ALUMNI', 'ADMISSIONS'],
  },
  {
    id: 'usr_uol_2',
    tenantId: 'tnt_uol',
    fullName: 'Ahmed Raza',
    email: 'ahmed.raza@uol.edu.pk',
    role: TenantUserRole.TENANT_USER,
    status: UserStatus.ACTIVE,
    assignedApps: ['ALUMNI'],
  },
  {
    id: 'usr_uol_3',
    tenantId: 'tnt_uol',
    fullName: 'Sana Iqbal',
    email: 'sana.iqbal@uol.edu.pk',
    role: TenantUserRole.TENANT_USER,
    status: UserStatus.INVITED,
    assignedApps: ['ADMISSIONS'],
  },
]

export const auditEvents: AuditEvent[] = [
  {
    id: 'aud_1',
    tenantName: 'University of Lahore',
    actor: 'Platform Admin',
    action: 'TENANT_ACTIVATED',
    entity: 'tenant / uol-lahore',
    at: '2026-03-12 09:14',
  },
  {
    id: 'aud_2',
    tenantName: 'University of Lahore',
    actor: 'Platform Admin',
    action: 'SUBSCRIPTION_CREATED',
    entity: 'subscription / uol-lahore-20260312',
    at: '2026-03-12 09:16',
  },
  {
    id: 'aud_3',
    tenantName: 'University of Lahore',
    actor: 'Farah Malik',
    action: 'INVITATION_ACCEPTED',
    entity: 'invitation / farah.malik@uol.edu.pk',
    at: '2026-03-12 11:02',
  },
  {
    id: 'aud_4',
    tenantName: 'LUMS',
    actor: 'Platform Admin',
    action: 'TENANT_CREATED',
    entity: 'tenant / lums',
    at: '2026-08-28 16:40',
  },
  {
    id: 'aud_5',
    tenantName: 'Aga Khan University',
    actor: 'Platform Admin',
    action: 'TENANT_SUSPENDED',
    entity: 'tenant / aku',
    at: '2026-08-01 10:05',
  },
]
