import { DeploymentModel, TenantStatus, type Tenant } from '@/lib/types'

export type TenantDraft = {
  tenantCode: string
  legalName: string
  displayName: string
  institutionType: string
  websiteUrl: string
  deploymentModel: DeploymentModel
  countryCode: string
  provinceCode: string
  city: string
}

export type CreateTenantBody = {
  tenantCode?: string
  legalName: string
  displayName: string
  institutionType: string
  websiteUrl?: string
  deploymentModel?: DeploymentModel
  countryCode?: string
  provinceCode?: string
  city?: string
}

export type UpdateTenantBody = {
  legalName?: string
  displayName?: string
  websiteUrl?: string
  city?: string
  provinceCode?: string
}

export function emptyTenantDraft(): TenantDraft {
  return {
    tenantCode: '',
    legalName: '',
    displayName: '',
    institutionType: 'UNIVERSITY',
    websiteUrl: '',
    deploymentModel: DeploymentModel.SAAS,
    countryCode: 'PK',
    provinceCode: '',
    city: '',
  }
}

export function tenantDraftFrom(tenant: Tenant): TenantDraft {
  return {
    tenantCode: tenant.tenantCode,
    legalName: tenant.legalName,
    displayName: tenant.displayName,
    institutionType: tenant.institutionType,
    websiteUrl: tenant.websiteUrl ?? '',
    deploymentModel: tenant.deploymentModel,
    countryCode: tenant.countryCode,
    provinceCode: tenant.provinceCode ?? '',
    city: tenant.city ?? '',
  }
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

export function websiteOrUndefined(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function validateTenantDraft(draft: TenantDraft, mode: 'create' | 'update') {
  if (!draft.legalName.trim() || !draft.displayName.trim()) {
    return 'Legal name and display name are required'
  }
  if (draft.legalName.trim().length > 255) return 'Legal name must be 255 characters or fewer'
  if (draft.displayName.trim().length > 255) return 'Display name must be 255 characters or fewer'
  if (mode === 'create') {
    if (!draft.institutionType.trim()) return 'Institution type is required'
    if (draft.institutionType.trim().length > 50) return 'Institution type must be 50 characters or fewer'
    if (draft.tenantCode.trim() && draft.tenantCode.trim().length < 2) {
      return 'Tenant code must be at least 2 characters'
    }
    if (draft.tenantCode.trim().length > 50) return 'Tenant code must be 50 characters or fewer'
    if (draft.countryCode.trim() && draft.countryCode.trim().length > 2) {
      return 'Country code must be 2 characters (for example PK)'
    }
  }
  if (draft.websiteUrl.trim().length > 500) return 'Website must be 500 characters or fewer'
  if (draft.provinceCode.trim().length > 20) return 'Province must be 20 characters or fewer'
  if (draft.city.trim().length > 100) return 'City must be 100 characters or fewer'
  return null
}

export function createTenantPayload(draft: TenantDraft): CreateTenantBody {
  return {
    tenantCode: optional(draft.tenantCode),
    legalName: draft.legalName.trim(),
    displayName: draft.displayName.trim(),
    institutionType: draft.institutionType.trim(),
    websiteUrl: websiteOrUndefined(draft.websiteUrl),
    deploymentModel: draft.deploymentModel,
    countryCode: optional(draft.countryCode) ?? 'PK',
    provinceCode: optional(draft.provinceCode),
    city: optional(draft.city),
  }
}

export function updateTenantPayload(draft: TenantDraft): UpdateTenantBody {
  return {
    legalName: draft.legalName.trim(),
    displayName: draft.displayName.trim(),
    websiteUrl: websiteOrUndefined(draft.websiteUrl),
    provinceCode: optional(draft.provinceCode),
    city: optional(draft.city),
  }
}

export function lifecycleFor(status: TenantStatus) {
  return {
    canActivate: status !== TenantStatus.ACTIVE,
    canSuspend: status !== TenantStatus.SUSPENDED && status !== TenantStatus.RETIRED,
    canRetire: status !== TenantStatus.RETIRED,
  }
}
