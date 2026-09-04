import { Link } from 'react-router-dom'
import { Building2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { useOwnTenant } from '@/lib/use-own-tenant'

export function TenantLauncherPage() {
  const { tenant, loading, missing } = useOwnTenant()

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-40 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (missing || !tenant) {
    return (
      <EmptyState
        title="No institution assigned"
        description="This account is not an active member of a tenant. Ask a platform administrator to invite you."
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={tenant.tenantCode}
        title={tenant.displayName}
        description="Manage this institution. Subscriptions and tenant-administrator invitations are assigned by the platform."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="portal-card p-5">
          <Building2 className="mb-3 size-5 text-[#00c2b2]" />
          <p className="font-medium">Institution</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contacts, addresses, and registration identifiers.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/tenant/profile">Open profile</Link>
          </Button>
        </div>
        <div className="portal-card p-5">
          <Settings2 className="mb-3 size-5 text-[#00c2b2]" />
          <p className="font-medium">Configuration</p>
          <p className="mt-1 text-sm text-muted-foreground">Locale, branding, SMTP, logos, and documents.</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/tenant/configuration">Open settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
