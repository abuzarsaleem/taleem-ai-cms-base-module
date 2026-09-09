import { EMAIL_PATTERN } from '@/lib/utils'
import type { UserTenantMembership } from '@/lib/types'

export function pickCurrentTenant(memberships: UserTenantMembership[]) {
  return (
    memberships.find((row) => row.isTenantAdmin && row.membershipStatus === 'ACTIVE') ??
    memberships.find((row) => row.membershipStatus === 'ACTIVE') ??
    memberships[0]
  )
}

export type CreateMembershipDraft = {
  email: string
  fullName: string
  password: string
  confirmPassword: string
}

export function validateCreateMembership(draft: CreateMembershipDraft) {
  const email = draft.email.trim()
  const fullName = draft.fullName.trim()
  if (!fullName) return 'Full name is required'
  if (fullName.length > 150) return 'Full name must be 150 characters or fewer'
  if (!email) return 'Email is required'
  if (email.length > 255) return 'Email must be 255 characters or fewer'
  if (!EMAIL_PATTERN.test(email)) return 'Email must be a valid address'
  if (draft.password.length < 8) return 'Password must be at least 8 characters'
  if (draft.password.length > 128) return 'Password must be 128 characters or fewer'
  if (draft.password !== draft.confirmPassword) return 'Passwords do not match'
  return null
}

export function createMembershipPayload(draft: CreateMembershipDraft) {
  return {
    email: draft.email.trim().toLowerCase(),
    fullName: draft.fullName.trim(),
    password: draft.password,
  }
}
