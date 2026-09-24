import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  KeyRound,
  LayoutGrid,
  MoreVertical,
  PlugZap,
  Settings2,
  Shield,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { StatusBadge } from '@/components/status-badge'
import { TenantLogo } from '@/components/tenant-logo'
import { errorMessage, useAuth } from '@/lib/auth'
import {
  PlatformComponentStatus,
  type CatalogApplication,
  type PlatformDashboardActivityItem,
  type PlatformDashboardAttentionItem,
  type PlatformDashboardCounts,
  type PlatformDashboardRecentTenant,
  type PlatformDashboardSystemComponent,
  type PlatformDashboardSystemStatus,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { platformDashboardService } from '@/services/platform'

const STAT_META = [
  { key: 'tenants' as const, title: 'Tenants', tone: 'blue' as const, icon: Building2 },
  { key: 'activeTenants' as const, title: 'Active Tenants', tone: 'green' as const, icon: Shield },
  { key: 'onboarding' as const, title: 'Onboarding', tone: 'amber' as const, icon: Users },
  { key: 'applications' as const, title: 'Applications', tone: 'violet' as const, icon: LayoutGrid },
]

const ATTENTION_META: Record<string, { icon: LucideIcon; tone: string; surface: string }> = {
  tenantsAwaitingActivation: {
    icon: Building2,
    tone: 'bg-red-500 text-white',
    surface: 'bg-red-500/10 text-red-600 dark:text-red-300',
  },
  integrationConfigurationsIncomplete: {
    icon: PlugZap,
    tone: 'bg-amber-500 text-white',
    surface: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  oauthClientsExpiringSoon: {
    icon: KeyRound,
    tone: 'bg-orange-500 text-white',
    surface: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  onboardingTasksPending: {
    icon: Clock3,
    tone: 'bg-blue-500 text-white',
    surface: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
}

const toneStyles = {
  blue: {
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
    stroke: '#0c3cff',
  },
  green: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    stroke: '#10b981',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    stroke: '#f59e0b',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    stroke: '#7c3aed',
  },
} as const

const statusTone: Record<string, string> = {
  OPERATIONAL: 'text-emerald-600 dark:text-emerald-300',
  DEGRADED: 'text-amber-600 dark:text-amber-300',
  DOWN: 'text-red-600 dark:text-red-300',
  UNKNOWN: 'text-muted-foreground',
}

function formatVsPreviousMonth(delta: number) {
  if (delta === 0) return '± 0 vs last month'
  return `${delta > 0 ? '+' : ''}${delta} vs last month`
}

function formatJoined(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function formatActivityTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function sparkFromMetric(value: number, delta: number) {
  const end = Math.max(value, 1)
  const start = Math.max(end - Math.max(Math.abs(delta), 1), 1)
  if (delta >= 0) {
    return [start, start + 1, start, start + 2, start + Math.max(delta, 1), end - 1, end]
  }
  return [end + Math.abs(delta), end + 1, end, end + 2, end - 1, start + 1, start]
}

function activityIcon(action: string): { icon: LucideIcon; tone: string } {
  if (action.includes('TENANT') || action.includes('ACTIVAT')) {
    return { icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-500/10' }
  }
  if (action.includes('APPLICATION')) {
    return { icon: LayoutGrid, tone: 'text-violet-600 bg-violet-500/10' }
  }
  if (action.includes('OAUTH')) {
    return { icon: KeyRound, tone: 'text-blue-600 bg-blue-500/10' }
  }
  if (action.includes('SMTP')) {
    return { icon: Settings2, tone: 'text-amber-600 bg-amber-500/10' }
  }
  if (action.includes('WARN') || action.includes('SUSPEND') || action.includes('ALERT')) {
    return { icon: AlertTriangle, tone: 'text-orange-600 bg-orange-500/10' }
  }
  return { icon: Clock3, tone: 'text-blue-600 bg-blue-500/10' }
}

function SystemStatusIcon({ status }: { status: string }) {
  if (status === PlatformComponentStatus.OPERATIONAL) {
    return <CheckCircle2 className="size-4 text-emerald-500" />
  }
  if (status === PlatformComponentStatus.DEGRADED) {
    return <AlertTriangle className="size-4 text-amber-500" />
  }
  if (status === PlatformComponentStatus.DOWN) {
    return <XCircle className="size-4 text-red-500" />
  }
  return <Clock3 className="size-4 text-muted-foreground" />
}

function Sparkline({ values, color }: { values: readonly number[]; color: string }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = 24 - ((value - min) / range) * 18
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 28" className="h-7 w-28" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

function SectionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-0.5 text-[13px] font-medium text-primary hover:underline">
      {label}
      <ArrowUpRight className="size-3.5" />
    </Link>
  )
}

function EmptyRow({ message }: { message: string }) {
  return <p className="rounded-[8px] border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">{message}</p>
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Skeleton className="h-28 w-full rounded-[10px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[10px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-[10px]" />
        <Skeleton className="h-72 rounded-[10px]" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <Skeleton className="h-64 rounded-[10px]" />
        <Skeleton className="h-64 rounded-[10px]" />
        <Skeleton className="h-64 rounded-[10px]" />
      </div>
    </div>
  )
}

export function PlatformDashboardPage() {
  const { session } = useAuth()
  const firstName = session?.user.fullName?.split(' ')[0] || 'there'

  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<PlatformDashboardCounts | null>(null)
  const [attention, setAttention] = useState<PlatformDashboardAttentionItem[]>([])
  const [recentTenants, setRecentTenants] = useState<PlatformDashboardRecentTenant[]>([])
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [activity, setActivity] = useState<PlatformDashboardActivityItem[]>([])
  const [systemStatus, setSystemStatus] = useState<PlatformDashboardSystemStatus | null>(null)
  const [activityUnavailable, setActivityUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [countsResult, attentionResult, tenantsResult, appsResult, statusResult] = await Promise.all([
          platformDashboardService.counts(),
          platformDashboardService.attention(),
          platformDashboardService.recentTenants(5),
          platformDashboardService.applications(4),
          platformDashboardService.systemStatus(),
        ])

        if (cancelled) return

        setCounts(countsResult)
        setAttention(attentionResult.items)
        setRecentTenants(tenantsResult.data)
        setApplications(appsResult.data)
        setSystemStatus(statusResult)

        try {
          const activityResult = await platformDashboardService.activity(5)
          if (!cancelled) {
            setActivity(activityResult.data)
            setActivityUnavailable(false)
          }
        } catch {
          if (!cancelled) {
            setActivity([])
            setActivityUnavailable(true)
          }
        }
      } catch (error) {
        if (!cancelled) toast.error(errorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="relative overflow-hidden rounded-[10px] border border-border bg-[linear-gradient(120deg,#eef4ff_0%,#f8fafc_55%,#ffffff_100%)] px-5 py-5 sm:px-6 dark:bg-[linear-gradient(120deg,#121c38_0%,#0e1833_60%,#0b142b_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 right-8 size-32 rounded-full bg-[radial-gradient(circle,rgb(12_60_255_/_0.14),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground">Welcome back, {firstName} 👋</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Platform Dashboard</h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              Manage institutions, applications, subscriptions and platform configuration.
            </p>
          </div>
          <blockquote className="max-w-xs rounded-[8px] border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
            <p className="italic">“Enabling education for a brighter tomorrow”</p>
            <p className="mt-2 text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Taleem AI CMS</p>
          </blockquote>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_META.map((stat) => {
          const metric = counts?.[stat.key]
          const styles = toneStyles[stat.tone]
          const value = metric?.value ?? 0
          const delta = metric?.vsPreviousMonth ?? 0
          return (
            <Card key={stat.key} size="sm" className="portal-card border-border">
              <CardHeader className="gap-2.5 pb-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardDescription className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </CardDescription>
                    <CardTitle className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                      {value}
                    </CardTitle>
                  </div>
                  <span className={cn('inline-flex size-8 items-center justify-center rounded-md', styles.icon)}>
                    <stat.icon className="size-4" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-2 pt-0">
                <p className="text-xs text-muted-foreground">{formatVsPreviousMonth(delta)}</p>
                <Sparkline values={sparkFromMetric(value, delta)} color={styles.stroke} />
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card size="sm" className="portal-card border-border">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b border-border pb-3">
            <div>
              <CardTitle className="text-sm">Requires attention</CardTitle>
              <CardDescription className="text-xs">Items that need a platform administrator action.</CardDescription>
            </div>
            <SectionLink to="/platform/tenants" label="View all" />
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {attention.length === 0 ? (
              <EmptyRow message="Nothing needs attention right now." />
            ) : (
              attention.map((item) => {
                const meta = ATTENTION_META[item.key] ?? {
                  icon: AlertTriangle,
                  tone: 'bg-slate-500 text-white',
                  surface: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
                }
                const Icon = meta.icon
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded-[8px] border border-border/80 bg-background/70 px-3 py-2.5"
                  >
                    <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-md', meta.surface)}>
                      <Icon className="size-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={item.label}>
                      {item.label}
                    </p>
                    <span
                      className={cn(
                        'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        meta.tone,
                      )}
                    >
                      {item.count}
                    </span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card size="sm" className="portal-card border-border">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b border-border pb-3">
            <div>
              <CardTitle className="text-sm">Recent tenants</CardTitle>
              <CardDescription className="text-xs">Latest institutions in the platform registry.</CardDescription>
            </div>
            <SectionLink to="/platform/tenants" label="View all" />
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {recentTenants.length === 0 ? (
              <EmptyRow message="No tenants registered yet." />
            ) : (
              recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex min-w-0 items-center gap-3 rounded-[8px] border border-border/80 bg-background/70 px-3 py-2.5"
                >
                  <TenantLogo
                    name={tenant.displayName}
                    logoUrl={tenant.logoUrl}
                    logoDarkUrl={tenant.logoDarkUrl}
                    className="size-8 rounded-md"
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <Link
                      to={`/platform/tenants/${tenant.id}`}
                      className="block truncate text-sm font-medium hover:text-primary hover:underline"
                      title={tenant.displayName}
                    >
                      {tenant.displayName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground" title={tenant.tenantCode}>
                      {tenant.tenantCode}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
                    <StatusBadge value={String(tenant.status)} />
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      Joined {formatJoined(tenant.joinedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    aria-label="Open tenant"
                    asChild
                  >
                    <Link to={`/platform/tenants/${tenant.id}`}>
                      <MoreVertical className="size-4" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <Card size="sm" className="portal-card border-border">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b border-border pb-3">
            <div>
              <CardTitle className="text-sm">Application catalogue</CardTitle>
              <CardDescription className="text-xs">Independently deployable apps registered on the platform.</CardDescription>
            </div>
            <SectionLink to="/platform/applications" label="View all" />
          </CardHeader>
          <CardContent className="grid gap-2.5 pt-3 sm:grid-cols-2">
            {applications.length === 0 ? (
              <div className="sm:col-span-2">
                <EmptyRow message="No applications registered yet." />
              </div>
            ) : (
              applications.map((app) => {
                const launchUrl = app.launchUrl?.trim()
                return (
                  <div key={app.id} className="rounded-[8px] border border-border/80 bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" className="rounded-md" />
                      <StatusBadge value={app.status} />
                    </div>
                    <p className="mt-2.5 truncate text-sm font-semibold" title={app.name}>
                      {app.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground" title={app.applicationCode}>
                      {app.applicationCode}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {app.version || '—'} · {app.tenantCount ?? 0} tenant{(app.tenantCount ?? 0) === 1 ? '' : 's'}
                    </p>
                    {app.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{app.description}</p>
                    ) : null}
                    {launchUrl ? (
                      <a
                        href={launchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-0.5 text-[13px] font-medium text-primary hover:underline"
                      >
                        Open
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    ) : (
                      <span className="mt-2.5 inline-flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground">
                        No launch URL
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card size="sm" className="portal-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm">Recent activity</CardTitle>
            <CardDescription className="text-xs">Latest platform administrator actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {activityUnavailable ? (
              <EmptyRow message="Activity feed requires audit access." />
            ) : activity.length === 0 ? (
              <EmptyRow message="No recent activity." />
            ) : (
              activity.map((item) => {
                const meta = activityIcon(item.action)
                const Icon = meta.icon
                return (
                  <div key={item.id} className="flex gap-3">
                    <span className={cn('mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md', meta.tone)}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.summary}</p>
                      <p className="text-xs text-muted-foreground">{item.action.replaceAll('_', ' ')}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/80">{formatActivityTime(item.createdAt)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card size="sm" className="portal-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm">System status</CardTitle>
            <CardDescription className="text-xs">Current health of platform services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {(systemStatus?.components ?? []).map((component: PlatformDashboardSystemComponent) => (
              <div
                key={component.key}
                className="flex items-center justify-between gap-2 rounded-[8px] border border-border/70 px-3 py-2.5"
                title={component.detail}
              >
                <div className="flex items-center gap-2.5">
                  <SystemStatusIcon status={component.status} />
                  <p className="text-sm font-medium">{component.label}</p>
                </div>
                <p className={cn('text-xs font-medium capitalize', statusTone[component.status] ?? statusTone.UNKNOWN)}>
                  {component.status.toLowerCase()}
                </p>
              </div>
            ))}
            {!systemStatus?.components.length ? <EmptyRow message="System status unavailable." /> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
