import { apiRequest, apiUpload } from '@/lib/api'
import type { CreateTenantBody, UpdateTenantBody } from '@/lib/tenant'
import type {
  AdminInvitation,
  AssetType,
  AvailableApplication,
  CatalogApplication,
  Entitlement,
  EntitlementStatus,
  MembershipStatus,
  Paginated,
  Subscription,
  Tenant,
  TenantAddress,
  TenantAsset,
  TenantConfiguration,
  TenantContact,
  TenantIdentifier,
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
    return apiRequest<Paginated<CatalogApplication>>(`/application?page=${page}&limit=${limit}`)
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
}

export const tenantService = {
  list(page = 1, limit = 20) {
    return apiRequest<Paginated<Tenant>>(`/tenant?page=${page}&limit=${limit}`)
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
        applicationCodes: draft.applicationCodes,
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

export const entitlementService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<Entitlement>>(`/tenant/${tenantId}/entitlement?page=${page}&limit=${limit}`)
  },
  get(tenantId: string, entitlementId: string) {
    return apiRequest<Entitlement>(`/tenant/${tenantId}/entitlement/${entitlementId}`)
  },
  create(
    tenantId: string,
    body: { applicationCode: string; subscriptionId?: string; effectiveFrom?: string; effectiveUntil?: string },
  ) {
    return apiRequest<Entitlement>(`/tenant/${tenantId}/entitlement`, { method: 'POST', body })
  },
  update(
    tenantId: string,
    entitlementId: string,
    body: { status?: EntitlementStatus; subscriptionId?: string; effectiveFrom?: string; effectiveUntil?: string },
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
