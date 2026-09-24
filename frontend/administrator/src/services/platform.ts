import { apiRequest, apiUpload } from '@/lib/api'
import type { CreateTenantBody, UpdateTenantBody } from '@/lib/tenant'
import { toQuery } from '@/lib/utils'
import type {
  AdminInvitation,
  ApplicationListResponse,
  ApplicationPermission,
  ApplicationRole,
  AssetType,
  AvailableApplication,
  CatalogApplication,
  CreateOAuthClientResponse,
  Entitlement,
  OAuthClient,
  EntitlementStatus,
  MembershipStatus,
  Paginated,
  PlatformConfigurationRow,
  PlatformDashboardActivityItem,
  PlatformDashboardAttention,
  PlatformDashboardCounts,
  PlatformDashboardRecentTenant,
  PlatformDashboardSystemStatus,
  PlatformTenantAdmin,
  ProvisionTenantAdminBody,
  ProvisionTenantAdminResult,
  Subscription,
  Tenant,
  TenantAddress,
  TenantAsset,
  TenantConfiguration,
  TenantContact,
  TenantIdentifier,
  TenantListQuery,
  TenantListResponse,
  TenantMembership,
  TenantSmtp,
  UserTenantMembership,
} from '@/lib/types'
import type { SubscriptionDraft } from '@/lib/subscription'

export type CatalogItem = {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
}

export const catalogService = {
  departments() {
    return apiRequest<CatalogItem[]>('/catalog/department')
  },
  designations() {
    return apiRequest<CatalogItem[]>('/catalog/designation')
  },
  identifierTypes() {
    return apiRequest<CatalogItem[]>('/catalog/identifier-type')
  },
}

export const applicationService = {
  list(page = 1, limit = 50) {
    return apiRequest<ApplicationListResponse>(`/application?page=${page}&limit=${limit}`)
  },
  get(applicationId: string) {
    return apiRequest<CatalogApplication>(`/application/${applicationId}`)
  },
  create(body: {
    applicationCode: string
    name: string
    description?: string
    version?: string
    launchUrl?: string
  }) {
    return apiRequest<CatalogApplication>('/application', { method: 'POST', body })
  },
  update(
    applicationId: string,
    body: { name?: string; description?: string; version?: string; launchUrl?: string },
  ) {
    return apiRequest<CatalogApplication>(`/application/${applicationId}`, { method: 'PATCH', body })
  },
  deactivate(applicationId: string) {
    return apiRequest<CatalogApplication>(`/application/${applicationId}/deactivate`, { method: 'POST' })
  },
  uploadLogo(applicationId: string, file: File) {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<CatalogApplication>(`/application/${applicationId}/logo`, form)
  },
  removeLogo(applicationId: string) {
    return apiRequest<CatalogApplication>(`/application/${applicationId}/logo`, { method: 'DELETE' })
  },
}

export const applicationAccessService = {
  roles(applicationCode?: string) {
    return apiRequest<ApplicationRole[]>(`/application-access/roles${toQuery({ applicationCode })}`)
  },
  permissions(applicationId: string) {
    return apiRequest<ApplicationPermission[]>(`/application-access/applications/${applicationId}/permissions`)
  },
}

export const applicationRoleService = {
  list(applicationId: string) {
    return apiRequest<ApplicationRole[]>(`/application/${applicationId}/roles`)
  },
  get(applicationId: string, roleId: string) {
    return apiRequest<ApplicationRole>(`/application/${applicationId}/roles/${roleId}`)
  },
  create(
    applicationId: string,
    body: { roleCode: string; roleName: string; description?: string; permissionIds?: string[] },
  ) {
    return apiRequest<ApplicationRole>(`/application/${applicationId}/roles`, { method: 'POST', body })
  },
  update(applicationId: string, roleId: string, body: { roleName?: string; description?: string }) {
    return apiRequest<ApplicationRole>(`/application/${applicationId}/roles/${roleId}`, {
      method: 'PATCH',
      body,
    })
  },
  addPermissions(applicationId: string, roleId: string, permissionIds: string[]) {
    return apiRequest<ApplicationRole>(`/application/${applicationId}/roles/${roleId}/permissions`, {
      method: 'POST',
      body: { permissionIds },
    })
  },
  removePermission(applicationId: string, roleId: string, permissionId: string) {
    return apiRequest<ApplicationRole>(
      `/application/${applicationId}/roles/${roleId}/permissions/${permissionId}`,
      { method: 'DELETE' },
    )
  },
}

export const oauthClientService = {
  list(page = 1, limit = 100) {
    return apiRequest<Paginated<OAuthClient>>(`/oauth/client?page=${page}&limit=${limit}`)
  },
  create(body: {
    application_id: string
    client_id: string
    client_name: string
    client_type: string
    redirect_uris: string[]
    client_secret?: string
  }) {
    return apiRequest<CreateOAuthClientResponse>('/oauth/client', { method: 'POST', body })
  },
}

export const tenantService = {
  list(page = 1, limit = 20, filters: Omit<TenantListQuery, 'page' | 'limit'> = {}) {
    return apiRequest<TenantListResponse>(
      `/tenant${toQuery({
        page,
        limit,
        search: filters.search,
        status: filters.status,
        institutionType: filters.institutionType,
        deploymentModel: filters.deploymentModel,
        tenantCode: filters.tenantCode,
        countryCode: filters.countryCode,
        city: filters.city,
      })}`,
    )
  },
  get(tenantId: string) {
    return apiRequest<Tenant>(`/tenant/${tenantId}`)
  },
  create(body: CreateTenantBody) {
    return apiRequest<Tenant>('/tenant', { method: 'POST', body })
  },
  update(tenantId: string, body: UpdateTenantBody) {
    return apiRequest<Tenant>(`/tenant/${tenantId}`, { method: 'PATCH', body })
  },
  activate(tenantId: string) {
    return apiRequest<Tenant>(`/tenant/${tenantId}/activate`, { method: 'POST' })
  },
  suspend(tenantId: string) {
    return apiRequest<Tenant>(`/tenant/${tenantId}/suspend`, { method: 'POST' })
  },
  retire(tenantId: string) {
    return apiRequest<Tenant>(`/tenant/${tenantId}/retire`, { method: 'POST' })
  },
  availableApplications(tenantId: string) {
    return apiRequest<{ tenantId: string; applications: AvailableApplication[] }>(
      `/tenant/${tenantId}/application`,
    )
  },
}

export const tenantContactService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<TenantContact>>(`/tenant/${tenantId}/contact?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, id: string) {
    return apiRequest<TenantContact>(`/tenant/${tenantId}/contact/${id}`)
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantContact>(`/tenant/${tenantId}/contact`, { method: 'POST', body })
  },
  update(tenantId: string, id: string, body: Record<string, unknown>) {
    return apiRequest<TenantContact>(`/tenant/${tenantId}/contact/${id}`, { method: 'PATCH', body })
  },
  delete(tenantId: string, id: string) {
    return apiRequest<void>(`/tenant/${tenantId}/contact/${id}`, { method: 'DELETE' })
  },
}

export const tenantAddressService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<TenantAddress>>(`/tenant/${tenantId}/address?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, id: string) {
    return apiRequest<TenantAddress>(`/tenant/${tenantId}/address/${id}`)
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantAddress>(`/tenant/${tenantId}/address`, { method: 'POST', body })
  },
  update(tenantId: string, id: string, body: Record<string, unknown>) {
    return apiRequest<TenantAddress>(`/tenant/${tenantId}/address/${id}`, { method: 'PATCH', body })
  },
  delete(tenantId: string, id: string) {
    return apiRequest<void>(`/tenant/${tenantId}/address/${id}`, { method: 'DELETE' })
  },
}

export const tenantIdentifierService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<TenantIdentifier>>(`/tenant/${tenantId}/identifier?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, id: string) {
    return apiRequest<TenantIdentifier>(`/tenant/${tenantId}/identifier/${id}`)
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantIdentifier>(`/tenant/${tenantId}/identifier`, { method: 'POST', body })
  },
  update(tenantId: string, id: string, body: Record<string, unknown>) {
    return apiRequest<TenantIdentifier>(`/tenant/${tenantId}/identifier/${id}`, { method: 'PATCH', body })
  },
  delete(tenantId: string, id: string) {
    return apiRequest<void>(`/tenant/${tenantId}/identifier/${id}`, { method: 'DELETE' })
  },
}

export const tenantConfigurationService = {
  get(tenantId: string) {
    return apiRequest<TenantConfiguration>(`/tenant/${tenantId}/configuration`)
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantConfiguration>(`/tenant/${tenantId}/configuration`, { method: 'POST', body })
  },
  update(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantConfiguration>(`/tenant/${tenantId}/configuration`, { method: 'PATCH', body })
  },
  delete(tenantId: string) {
    return apiRequest<void>(`/tenant/${tenantId}/configuration`, { method: 'DELETE' })
  },
}

export const tenantSmtpService = {
  get(tenantId: string) {
    return apiRequest<TenantSmtp>(`/tenant/${tenantId}/smtp`)
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantSmtp>(`/tenant/${tenantId}/smtp`, { method: 'POST', body })
  },
  update(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantSmtp>(`/tenant/${tenantId}/smtp`, { method: 'PATCH', body })
  },
  delete(tenantId: string) {
    return apiRequest<void>(`/tenant/${tenantId}/smtp`, { method: 'DELETE' })
  },
}

export const tenantAssetService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<TenantAsset>>(`/tenant/${tenantId}/asset?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, id: string) {
    return apiRequest<TenantAsset>(`/tenant/${tenantId}/asset/${id}`)
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<TenantAsset>(`/tenant/${tenantId}/asset`, { method: 'POST', body })
  },
  update(tenantId: string, id: string, body: Record<string, unknown>) {
    return apiRequest<TenantAsset>(`/tenant/${tenantId}/asset/${id}`, { method: 'PATCH', body })
  },
  delete(tenantId: string, id: string) {
    return apiRequest<void>(`/tenant/${tenantId}/asset/${id}`, { method: 'DELETE' })
  },
  upload(tenantId: string, assetType: AssetType, file: File) {
    const form = new FormData()
    form.append('assetType', assetType)
    form.append('file', file)
    return apiUpload<TenantAsset>(`/tenant/${tenantId}/asset/upload`, form)
  },
}

type PlatformListQuery = {
  page?: number
  limit?: number
  tenantId?: string
  search?: string
  status?: string
  progressStatus?: string
  contactType?: string
  email?: string
  isActive?: boolean
  isPrimary?: boolean
  addressType?: string
  city?: string
  countryCode?: string
  identifierType?: string
  identifierValue?: string
  isVerified?: boolean
  timezone?: string
  locale?: string
  currencyCode?: string
  host?: string
  assetType?: string
}

export const platformContactService = {
  list(query: PlatformListQuery = {}) {
    return apiRequest<Paginated<TenantContact>>(`/platform/contact${toQuery(query)}`)
  },
}

export const platformAddressService = {
  list(query: PlatformListQuery = {}) {
    return apiRequest<Paginated<TenantAddress>>(`/platform/address${toQuery(query)}`)
  },
}

export const platformIdentifierService = {
  list(query: PlatformListQuery = {}) {
    return apiRequest<Paginated<TenantIdentifier>>(`/platform/identifier${toQuery(query)}`)
  },
}

export const platformConfigurationService = {
  list(query: PlatformListQuery = {}) {
    return apiRequest<Paginated<PlatformConfigurationRow>>(`/platform/configuration${toQuery(query)}`)
  },
}

export const platformSmtpService = {
  list(query: PlatformListQuery = {}) {
    return apiRequest<Paginated<TenantSmtp>>(`/platform/smtp${toQuery(query)}`)
  },
}

export const platformAssetService = {
  list(query: PlatformListQuery = {}) {
    return apiRequest<Paginated<TenantAsset>>(`/platform/asset${toQuery(query)}`)
  },
}

export const subscriptionService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<Subscription>>(`/tenant/${tenantId}/subscription?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, subscriptionId: string) {
    return apiRequest<Subscription>(`/tenant/${tenantId}/subscription/${subscriptionId}`)
  },
  create(tenantId: string, draft: SubscriptionDraft) {
    return apiRequest<Subscription>(`/tenant/${tenantId}/subscription`, {
      method: 'POST',
      body: {
        startDate: draft.startDate,
        endDate: draft.endDate,
        planType: draft.planType,
        billingCycle: draft.billingCycle,
        applications: draft.applications.map((app) => ({
          applicationCode: app.applicationCode,
          launchUrl: app.launchUrl.trim() || undefined,
          maxUsers: app.maxUsers.trim() ? Number(app.maxUsers) : undefined,
        })),
      },
    })
  },
  update(tenantId: string, subscriptionId: string, body: Record<string, unknown>) {
    return apiRequest<Subscription>(`/tenant/${tenantId}/subscription/${subscriptionId}`, {
      method: 'PATCH',
      body,
    })
  },
}

export const platformSubscriptionService = {
  list(query: {
    page?: number
    limit?: number
    tenantId?: string
    status?: string
    planType?: string
    billingCycle?: string
    subscriptionCode?: string
  } = {}) {
    return apiRequest<Paginated<Subscription>>(`/platform/subscription${toQuery(query)}`)
  },
}

export const platformEntitlementService = {
  list(query: {
    page?: number
    limit?: number
    tenantId?: string
    applicationId?: string
    subscriptionId?: string
    status?: string
  } = {}) {
    return apiRequest<Paginated<Entitlement>>(`/platform/entitlement${toQuery(query)}`)
  },
}

export const entitlementService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<Entitlement>>(`/tenant/${tenantId}/entitlement?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, entitlementId: string) {
    return apiRequest<Entitlement>(`/tenant/${tenantId}/entitlement/${entitlementId}`)
  },
  create(
    tenantId: string,
    body: {
      applicationCode: string
      subscriptionId?: string
      effectiveFrom?: string
      effectiveUntil?: string
      launchUrl?: string
      maxUsers?: number
    },
  ) {
    return apiRequest<Entitlement>(`/tenant/${tenantId}/entitlement`, { method: 'POST', body })
  },
  update(
    tenantId: string,
    entitlementId: string,
    body: {
      status?: EntitlementStatus
      subscriptionId?: string
      effectiveFrom?: string
      effectiveUntil?: string
      launchUrl?: string
      maxUsers?: number | null
    },
  ) {
    return apiRequest<Entitlement>(`/tenant/${tenantId}/entitlement/${entitlementId}`, {
      method: 'PATCH',
      body,
    })
  },
}

export const membershipService = {
  listMine(page = 1, limit = 50, token?: string | null) {
    return apiRequest<Paginated<UserTenantMembership>>(`/user/me/tenant-membership?page=${page}&limit=${limit}`, {
      token,
    })
  },
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<TenantMembership>>(`/tenant/${tenantId}/membership?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, membershipId: string) {
    return apiRequest<TenantMembership>(`/tenant/${tenantId}/membership/${membershipId}`)
  },
  update(tenantId: string, membershipId: string, body: { status?: MembershipStatus; isTenantAdmin?: boolean }) {
    return apiRequest<TenantMembership>(`/tenant/${tenantId}/membership/${membershipId}`, {
      method: 'PATCH',
      body,
    })
  },
  remove(tenantId: string, membershipId: string) {
    return apiRequest<void>(`/tenant/${tenantId}/membership/${membershipId}`, { method: 'DELETE' })
  },
  create(
    tenantId: string,
    body: { email: string; password: string; fullName: string },
  ) {
    return apiRequest<TenantMembership>(`/tenant/${tenantId}/membership`, { method: 'POST', body })
  },
}

export const platformTenantAdminService = {
  list(query: {
    page?: number
    limit?: number
    tenantId?: string
    applicationId?: string
    status?: string
    search?: string
  } = {}) {
    return apiRequest<Paginated<PlatformTenantAdmin>>(`/platform/tenant-admin${toQuery(query)}`)
  },
  provision(tenantId: string, body: ProvisionTenantAdminBody) {
    return apiRequest<ProvisionTenantAdminResult>(`/platform/tenant/${tenantId}/admin`, {
      method: 'POST',
      body,
    })
  },
}

export const platformAdminInvitationService = {
  list(query: {
    page?: number
    limit?: number
    tenantId?: string
    email?: string
    status?: string
  } = {}) {
    return apiRequest<Paginated<AdminInvitation>>(`/platform/admin-invitation${toQuery(query)}`)
  },
}

export const memberInvitationService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<AdminInvitation>>(`/tenant/${tenantId}/member-invitation?page=${page}&limit=${limit}`)
  },
  create(tenantId: string, email: string) {
    return apiRequest<AdminInvitation & { invitationToken: string }>(`/tenant/${tenantId}/member-invitation`, {
      method: 'POST',
      body: { email },
    })
  },
  resend(tenantId: string, id: string) {
    return apiRequest<AdminInvitation & { invitationToken: string }>(
      `/tenant/${tenantId}/member-invitation/${id}/resend`,
      { method: 'POST' },
    )
  },
  cancel(tenantId: string, id: string) {
    return apiRequest<AdminInvitation>(`/tenant/${tenantId}/member-invitation/${id}`, { method: 'DELETE' })
  },
}

export const invitationService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<AdminInvitation>>(`/tenant/${tenantId}/admin-invitation?page=${page}&limit=${limit}`)
  },
  create(tenantId: string, email: string) {
    return apiRequest<AdminInvitation & { invitationToken: string }>(`/tenant/${tenantId}/admin-invitation`, {
      method: 'POST',
      body: { email },
    })
  },
  resend(tenantId: string, id: string) {
    return apiRequest<AdminInvitation & { invitationToken: string }>(
      `/tenant/${tenantId}/admin-invitation/${id}/resend`,
      { method: 'POST' },
    )
  },
  cancel(tenantId: string, id: string) {
    return apiRequest<AdminInvitation>(`/tenant/${tenantId}/admin-invitation/${id}`, { method: 'DELETE' })
  },
}

export const platformDashboardService = {
  counts() {
    return apiRequest<PlatformDashboardCounts>('/platform/dashboard/counts')
  },
  attention() {
    return apiRequest<PlatformDashboardAttention>('/platform/dashboard/attention')
  },
  applications(limit = 4) {
    return apiRequest<{ data: CatalogApplication[] }>(`/platform/dashboard/applications${toQuery({ limit })}`)
  },
  recentTenants(limit = 5) {
    return apiRequest<{ data: PlatformDashboardRecentTenant[] }>(
      `/platform/dashboard/recent-tenants${toQuery({ limit })}`,
    )
  },
  activity(limit = 5) {
    return apiRequest<{ data: PlatformDashboardActivityItem[] }>(
      `/platform/dashboard/activity${toQuery({ limit })}`,
    )
  },
  systemStatus() {
    return apiRequest<PlatformDashboardSystemStatus>('/platform/dashboard/system-status')
  },
}
