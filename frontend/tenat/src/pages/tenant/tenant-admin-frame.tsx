import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/page-header'
import { useOwnTenant } from '@/lib/use-own-tenant'

export function TenantAdminFrame({ children }: { children: (tenantId: string) => ReactNode }) {
  const { tenantId, tenant, loading, missing } = useOwnTenant()

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (missing || !tenantId || !tenant) {
    return (
      <EmptyState
        title="No institution assigned"
        description="This account is not an active member of a tenant. Ask a platform administrator to invite you."
      />
    )
  }

  return children(tenantId)
}
