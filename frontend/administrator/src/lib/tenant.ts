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
  const errors = tenantFieldErrors(draft, mode)
  return Object.values(errors)[0] ?? null
}

export function tenantFieldErrors(draft: TenantDraft, mode: 'create' | 'update') {
  const errors: Partial<Record<keyof TenantDraft, string>> = {}
  if (!draft.legalName.trim()) errors.legalName = 'Legal name is required'
  else if (draft.legalName.trim().length > 255) errors.legalName = 'Legal name must be 255 characters or fewer'
  if (!draft.displayName.trim()) errors.displayName = 'Display name is required'
  else if (draft.displayName.trim().length > 255) errors.displayName = 'Display name must be 255 characters or fewer'
  if (mode === 'create') {
    if (!draft.institutionType.trim()) errors.institutionType = 'Institution type is required'
    else if (draft.institutionType.trim().length > 50) {
      errors.institutionType = 'Institution type must be 50 characters or fewer'
    }
    if (!draft.countryCode.trim()) errors.countryCode = 'Please select a country'
    else if (draft.countryCode.trim().length > 2) {
      errors.countryCode = 'Country code must be 2 characters (for example PK)'
    }
  }
  if (draft.websiteUrl.trim().length > 500) errors.websiteUrl = 'Website must be 500 characters or fewer'
  if (draft.provinceCode.trim().length > 20) errors.provinceCode = 'Province must be 20 characters or fewer'
  if (draft.city.trim().length > 100) errors.city = 'City must be 100 characters or fewer'
  return errors
}

export function createTenantPayload(draft: TenantDraft): CreateTenantBody {
  return {
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
