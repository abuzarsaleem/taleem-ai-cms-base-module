import type { UserTenantMembership } from '@/lib/types'

export function pickCurrentTenant(memberships: UserTenantMembership[]) {
  return (
    memberships.find((row) => row.isTenantAdmin && row.membershipStatus === 'ACTIVE') ??
    memberships.find((row) => row.membershipStatus === 'ACTIVE') ??
    memberships[0]
  )
}
