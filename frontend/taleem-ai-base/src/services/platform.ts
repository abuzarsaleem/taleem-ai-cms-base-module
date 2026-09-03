import { apiRequest } from '@/lib/api'
import type {
  AvailableApplication,
  CatalogApplication,
  Entitlement,
  EntitlementStatus,
  Paginated,
  Subscription,
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
    return apiRequest<Paginated<import('@/lib/types').Tenant>>(`/tenant?page=${page}&limit=${limit}`)
  },
  get(tenantId: string) {
    return apiRequest<import('@/lib/types').Tenant>(`/tenant/${tenantId}`)
  },
  create(body: Record<string, unknown>) {
    return apiRequest<import('@/lib/types').Tenant>('/tenant', { method: 'POST', body })
  },
  update(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<import('@/lib/types').Tenant>(`/tenant/${tenantId}`, { method: 'PATCH', body })
  },
  activate(tenantId: string) {
    return apiRequest<import('@/lib/types').Tenant>(`/tenant/${tenantId}/activate`, { method: 'POST' })
  },
  suspend(tenantId: string) {
    return apiRequest<import('@/lib/types').Tenant>(`/tenant/${tenantId}/suspend`, { method: 'POST' })
  },
  retire(tenantId: string) {
    return apiRequest<import('@/lib/types').Tenant>(`/tenant/${tenantId}/retire`, { method: 'POST' })
  },
  availableApplications(tenantId: string) {
    return apiRequest<{ tenantId: string; applications: AvailableApplication[] }>(
      `/tenant/${tenantId}/application`,
    )
  },
}

export const tenantProfileService = {
  get(tenantId: string) {
    return apiRequest<import('@/lib/types').InstitutionProfile>(`/tenant/${tenantId}/institution-profile`)
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<import('@/lib/types').InstitutionProfile>(`/tenant/${tenantId}/institution-profile`, {
      method: 'POST',
      body,
    })
  },
  update(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<import('@/lib/types').InstitutionProfile>(`/tenant/${tenantId}/institution-profile`, {
      method: 'PATCH',
      body,
    })
  },
}

export const tenantContactService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<import('@/lib/types').TenantContact>>(
      `/tenant/${tenantId}/contact?page=${page}&limit=${limit}`,
    )
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<import('@/lib/types').TenantContact>(`/tenant/${tenantId}/contact`, {
      method: 'POST',
      body,
    })
  },
  delete(tenantId: string, id: string) {
    return apiRequest<void>(`/tenant/${tenantId}/contact/${id}`, { method: 'DELETE' })
  },
}

export const tenantAddressService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<import('@/lib/types').TenantAddress>>(
      `/tenant/${tenantId}/address?page=${page}&limit=${limit}`,
    )
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<import('@/lib/types').TenantAddress>(`/tenant/${tenantId}/address`, {
      method: 'POST',
      body,
    })
  },
  delete(tenantId: string, id: string) {
    return apiRequest<void>(`/tenant/${tenantId}/address/${id}`, { method: 'DELETE' })
  },
}

export const tenantIdentifierService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<import('@/lib/types').TenantIdentifier>>(
      `/tenant/${tenantId}/identifier?page=${page}&limit=${limit}`,
    )
  },
  create(tenantId: string, body: Record<string, unknown>) {
    return apiRequest<import('@/lib/types').TenantIdentifier>(`/tenant/${tenantId}/identifier`, {
      method: 'POST',
      body,
    })
  },
  delete(tenantId: string, id: string) {
    return apiRequest<void>(`/tenant/${tenantId}/identifier/${id}`, { method: 'DELETE' })
  },
}

export const subscriptionService = {
  list(tenantId: string, page = 1, limit = 50) {
    return apiRequest<Paginated<Subscription>>(`/tenant/${tenantId}/subscription?page=${page}&limit=${limit}`)
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
  create(
    tenantId: string,
    body: { applicationCode: string; subscriptionId?: string; effectiveFrom?: string; effectiveUntil?: string },
  ) {
    return apiRequest<Entitlement>(`/tenant/${tenantId}/entitlement`, { method: 'POST', body })
  },
  update(tenantId: string, entitlementId: string, body: { status?: EntitlementStatus; effectiveUntil?: string }) {
    return apiRequest<Entitlement>(`/tenant/${tenantId}/entitlement/${entitlementId}`, {
      method: 'PATCH',
      body,
    })
  },
}

export const invitationService = {
  list(tenantId: string, page = 1, limit = 50, role = 'TENANT_ADMIN') {
    return apiRequest<Paginated<import('@/lib/types').AdminInvitation>>(
      `/tenant/${tenantId}/invitation?page=${page}&limit=${limit}&role=${role}`,
    )
  },
  create(tenantId: string, email: string, role: 'TENANT_ADMIN' | 'TENANT_MEMBER' = 'TENANT_ADMIN') {
    return apiRequest<import('@/lib/types').AdminInvitation & { invitationToken?: string }>(
      `/tenant/${tenantId}/invitation`,
      { method: 'POST', body: { email, role } },
    )
  },
  resend(tenantId: string, id: string) {
    return apiRequest<import('@/lib/types').AdminInvitation & { invitationToken?: string }>(
      `/tenant/${tenantId}/invitation/${id}/resend`,
      { method: 'POST' },
    )
  },
  cancel(tenantId: string, id: string) {
    return apiRequest<import('@/lib/types').AdminInvitation>(`/tenant/${tenantId}/invitation/${id}`, {
      method: 'DELETE',
    })
  },
}
