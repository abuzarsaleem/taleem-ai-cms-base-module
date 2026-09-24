import { EMAIL_PATTERN } from '@/lib/utils'
import type { CatalogApplication, ProvisionTenantAdminMode } from '@/lib/types'

export type TenantAdminAppSelection = {
  applicationId: string
  roleId: string
}

export type TenantAdminDraft = {
  mode: ProvisionTenantAdminMode
  tenantId: string
  fullName: string
  email: string
  password: string
  applications: TenantAdminAppSelection[]
}

export function emptyTenantAdminDraft(): TenantAdminDraft {
  return {
    mode: 'INVITE',
    tenantId: '',
    fullName: '',
    email: '',
    password: '',
    applications: [],
  }
}

/** Admin Portal apps: codes ending in _ADMIN or names containing "Admin". */
export function isAdminPortalApplication(app: CatalogApplication) {
  const code = app.applicationCode.toUpperCase()
  const name = app.name.toLowerCase()
  return code.endsWith('_ADMIN') || name.includes('admin portal') || name.includes('admin')
}

export function generatePassword(length = 14) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export function tenantAdminFieldErrors(draft: TenantAdminDraft) {
  const errors: Partial<Record<'tenantId' | 'fullName' | 'email' | 'password' | 'applications', string>> = {}
  if (!draft.tenantId) errors.tenantId = 'Select a tenant'
  if (draft.mode === 'CREATE' && !draft.fullName.trim()) errors.fullName = 'Full name is required'
  else if (draft.fullName.trim().length > 150) errors.fullName = 'Full name must be 150 characters or fewer'
  const email = draft.email.trim()
  if (!email) errors.email = 'Email is required'
  else if (email.length > 255) errors.email = 'Email must be 255 characters or fewer'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Email must be a valid address'
  if (draft.mode === 'CREATE') {
    if (!draft.password) errors.password = 'Password is required'
    else if (draft.password.length < 8) errors.password = 'Password must be at least 8 characters'
    else if (draft.password.length > 128) errors.password = 'Password must be 128 characters or fewer'
  }
  const missingRole = draft.applications.find((app) => !app.roleId)
  if (missingRole) errors.applications = 'Select a role for each selected application'
  return errors
}

export function tenantAdminPayload(draft: TenantAdminDraft) {
  return {
    mode: draft.mode,
    email: draft.email.trim().toLowerCase(),
    fullName: draft.fullName.trim() || undefined,
    password: draft.mode === 'CREATE' ? draft.password : undefined,
    applications: draft.applications.map((app, index) => ({
      applicationId: app.applicationId,
      roleId: app.roleId,
      isDefault: index === 0,
    })),
  }
}
