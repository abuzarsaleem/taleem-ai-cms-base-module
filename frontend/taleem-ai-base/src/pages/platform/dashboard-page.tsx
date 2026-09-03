import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, LayoutGrid, Shield, Users, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { TenantStatus, type CatalogApplication, type Tenant } from '@/lib/types'
import { applicationService, tenantService } from '@/services/platform'
import { toast } from 'sonner'

export function PlatformDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([tenantService.list(1, 50), applicationService.list(1, 50)])
      .then(([tenantPage, appPage]) => {
        if (cancelled) return
        setTenants(tenantPage.data)
        setApplications(appPage.data)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const active = tenants.filter((t) => t.status === TenantStatus.ACTIVE).length
  const onboarding = tenants.filter((t) => t.status === TenantStatus.ONBOARDING).length

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Platform"
        title="Platform overview"
        description="Onboard institutions, manage subscriptions and entitlements, and keep the application catalogue current."
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat title="Tenants" value={String(tenants.length)} icon={Building2} tone="navy" to="/platform/tenants" />
          <Stat title="Active" value={String(active)} icon={Shield} tone="cyan" to="/platform/tenants" />
          <Stat title="Onboarding" value={String(onboarding)} icon={Users} tone="amber" to="/platform/tenants" />
          <Stat
            title="Applications"
            value={String(applications.length)}
            icon={LayoutGrid}
            tone="navy"
            to="/platform/applications"
          />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="portal-card">
          <CardHeader>
            <CardTitle>Recent institutions</CardTitle>
            <CardDescription>Latest tenants from the platform registry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenants.slice(0, 6).map((tenant) => (
              <Link
                key={tenant.id}
                to={`/platform/tenants/${tenant.id}`}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3 py-2.5 transition-colors hover:border-[#00c2b2]/40 hover:bg-[#00c2b2]/5"
              >
                <div>
                  <p className="font-medium">{tenant.displayName}</p>
                  <p className="text-xs text-muted-foreground">{tenant.tenantCode}</p>
                </div>
                <StatusBadge value={tenant.status} />
              </Link>
            ))}
            {!loading && !tenants.length ? (
              <p className="text-sm text-muted-foreground">No tenants yet. Onboard the first institution.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="portal-card">
          <CardHeader>
            <CardTitle>Application catalogue</CardTitle>
            <CardDescription>Independently deployable applications registered on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.slice(0, 6).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3 py-2.5"
              >
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.applicationCode}</p>
                </div>
                <StatusBadge value={app.status} />
              </div>
            ))}
            {!loading && !applications.length ? (
              <p className="text-sm text-muted-foreground">Register an application to entitle tenants.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({
  title,
  value,
  icon: Icon,
  tone,
  to,
}: {
  title: string
  value: string
  icon: LucideIcon
  tone: 'navy' | 'cyan' | 'amber'
  to: string
}) {
  const tones = {
    navy: 'bg-[#081b45]/8 text-[#081b45] dark:bg-white/8 dark:text-white',
    cyan: 'bg-[#00c2b2]/15 text-[#0a7d73] dark:bg-[#00c2b2]/15 dark:text-[#7ef0e6]',
    amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  }

  return (
    <Link to={to} className="block h-full outline-none">
      <Card size="sm" className="portal-card h-full transition-shadow hover:shadow-[0_8px_24px_rgb(8_27_69_/_0.08)]">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <CardDescription className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {title}
            </CardDescription>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
              <Icon className="size-4" />
            </span>
          </div>
          <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">{value}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  )
}
