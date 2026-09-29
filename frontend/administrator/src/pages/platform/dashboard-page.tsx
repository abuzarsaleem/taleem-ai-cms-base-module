import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
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
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { PAGE_HERO_SURFACE, PageHeroGlow, PageHeroQuote } from '@/components/page-hero'
import { StatusBadge } from '@/components/status-badge'
import { StatMetricCard, type StatMetricTone } from '@/components/stat-metric-card'
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
  { key: 'tenants' as const, title: 'Tenants', tone: 'blue' as StatMetricTone, icon: Building2 },
  { key: 'activeTenants' as const, title: 'Active Tenants', tone: 'green' as StatMetricTone, icon: Shield },
  { key: 'onboarding' as const, title: 'Onboarding', tone: 'amber' as StatMetricTone, icon: Users },
  { key: 'applications' as const, title: 'Applications', tone: 'violet' as StatMetricTone, icon: LayoutGrid },
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

const statusTone: Record<string, string> = {
  OPERATIONAL: 'text-emerald-600 dark:text-emerald-300',
  DEGRADED: 'text-amber-600 dark:text-amber-300',
  DOWN: 'text-red-600 dark:text-red-300',
  UNKNOWN: 'text-muted-foreground',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function formatJoined(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatDate(date)
}

function formatActivityTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { time: value, day: '' }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfDate = new Date(date)
  startOfDate.setHours(0, 0, 0, 0)
  const daysAgo = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000)

  return {
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    day: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : formatDate(date),
  }
}

function activityIcon(action: string): { icon: LucideIcon; tone: string } {
  if (action.includes('WARN') || action.includes('SUSPEND') || action.includes('ALERT')) {
    return { icon: AlertTriangle, tone: 'text-orange-600 bg-orange-500/10' }
  }
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
  return { icon: Clock3, tone: 'text-blue-600 bg-blue-500/10' }
}

function SystemStatusIcon({ status }: { status: string }) {
  if (status === PlatformComponentStatus.OPERATIONAL) {
    return <CheckCircle2 className="size-[18px] text-emerald-500" />
  }
  if (status === PlatformComponentStatus.DEGRADED) {
    return <AlertTriangle className="size-[18px] text-amber-500" />
  }
  if (status === PlatformComponentStatus.DOWN) {
    return <XCircle className="size-[18px] text-red-500" />
  }
  return <Clock3 className="size-[18px] text-muted-foreground" />
}

function SectionLink({ to, label = 'View all' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium text-primary hover:underline"
    >
      {label}
      <ArrowRight className="size-3.5" />
    </Link>
  )
}

function DashboardCard({
  title,
  description,
  icon,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  contentClassName?: string
  children: ReactNode
}) {
  return (
    <Card className={cn('portal-card gap-3 rounded-xl border-border py-5', className)}>
      <CardHeader className="px-5">
        <div className="flex items-start gap-3">
          {icon}
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="mt-0.5 text-[13px]">{description}</CardDescription>
          </div>
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn('px-5', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

function EmptyRow({ message }: { message: string }) {
  return <p className="rounded-[8px] border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">{message}</p>
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_0.85fr]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
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

  const components = systemStatus?.components ?? []
  const allOperational =
    components.length > 0 && components.every((component) => component.status === PlatformComponentStatus.OPERATIONAL)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className={PAGE_HERO_SURFACE}>
        <PageHeroGlow />
        <div className="relative flex w-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{firstName}</span> 👋
            </p>
            <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-[#0f1f4d] dark:text-foreground">
              Platform Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage institutions, applications, subscriptions and platform configuration.
            </p>
          </div>
          <PageHeroQuote lines={['Enabling education', 'for a brighter tomorrow']} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_META.map((stat) => {
          const metric = counts?.[stat.key]
          return (
            <StatMetricCard
              key={stat.key}
              title={stat.title}
              value={metric?.value ?? 0}
              delta={metric?.vsPreviousMonth ?? 0}
              icon={stat.icon}
              tone={stat.tone}
            />
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardCard
          title="Requires attention"
          description="Items that need a platform administrator action."
          action={<SectionLink to="/platform/tenants" />}
        >
          {attention.length === 0 ? (
            <EmptyRow message="Nothing needs attention right now." />
          ) : (
            <div className="space-y-2">
              {attention.map((item) => {
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
              })}
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Recent tenants"
          description="Latest institutions in the platform registry."
          action={<SectionLink to="/platform/tenants" />}
        >
          {recentTenants.length === 0 ? (
            <EmptyRow message="No tenants registered yet." />
          ) : (
            <div className="divide-y divide-border">
              {recentTenants.map((tenant) => (
                <div key={tenant.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-1 last:pb-0">
                  <TenantLogo
                    name={tenant.displayName}
                    logoUrl={tenant.logoUrl}
                    logoDarkUrl={tenant.logoDarkUrl}
                    className="size-9 rounded-full"
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <Link
                      to={`/platform/tenants/${tenant.id}`}
                      className="block truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
                      title={tenant.displayName}
                    >
                      {tenant.displayName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground" title={tenant.tenantCode}>
                      {tenant.tenantCode}
                    </p>
                  </div>
                  <StatusBadge value={String(tenant.status)} className="hidden shrink-0 uppercase sm:inline-flex" />
                  <div className="hidden w-24 shrink-0 text-right sm:block">
                    <p className="text-[11px] text-muted-foreground">Joined</p>
                    <p className="whitespace-nowrap text-xs font-medium text-foreground">{formatJoined(tenant.joinedAt)}</p>
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
              ))}
            </div>
          )}
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr_0.85fr]">
        <DashboardCard
          title="Application catalogue"
          description="Independently deployable apps registered on the platform."
          action={<SectionLink to="/platform/applications" />}
        >
          {applications.length === 0 ? (
            <EmptyRow message="No applications registered yet." />
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {applications.map((app) => {
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
              })}
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Recent activity" description="Latest platform administrator actions.">
          {activityUnavailable ? (
            <EmptyRow message="Activity feed requires audit access." />
          ) : activity.length === 0 ? (
            <EmptyRow message="No recent activity." />
          ) : (
            <div className="divide-y divide-border">
              {activity.map((item) => {
                const meta = activityIcon(item.action)
                const Icon = meta.icon
                const when = formatActivityTime(item.createdAt)
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                    <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-full', meta.tone)}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground" title={item.summary}>
                        {item.summary}
                      </p>
                      <p className="truncate text-xs text-muted-foreground capitalize">
                        {item.action.replaceAll('_', ' ').toLowerCase()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="whitespace-nowrap text-xs text-foreground">{when.time}</p>
                      <p className="whitespace-nowrap text-[11px] text-muted-foreground">{when.day}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="System status"
          description={
            components.length === 0
              ? 'Current health of platform services.'
              : allOperational
                ? 'All systems operational.'
                : 'Some services need attention.'
          }
        >
          {components.length === 0 ? (
            <EmptyRow message="System status unavailable." />
          ) : (
            <div className="divide-y divide-border">
              {components.map((component: PlatformDashboardSystemComponent) => (
                <div
                  key={component.key}
                  className="flex items-center justify-between gap-2 py-3 first:pt-1 last:pb-0"
                  title={component.detail}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <SystemStatusIcon status={component.status} />
                    <p className="truncate text-sm font-medium text-foreground">{component.label}</p>
                  </div>
                  <p className={cn('text-xs font-medium capitalize', statusTone[component.status] ?? statusTone.UNKNOWN)}>
                    {component.status.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </section>
    </div>
  )
}
