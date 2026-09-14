import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AppWindow,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChevronRight,
  Image,
  LayoutGrid,
  Mail,
  MapPin,
  Plus,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { formatInvitationInstant } from '@/lib/invitation'
import { cn, initialsFromName } from '@/lib/utils'
import { useOwnTenant } from '@/lib/use-own-tenant'
import { MembershipRole, type TenantDashboard } from '@/lib/types'
import { tenantDashboardService } from '@/services/platform'

export function TenantLauncherPage() {
  const { tenantId, tenant, loading: tenantLoading, missing } = useOwnTenant()
  const [dashboard, setDashboard] = useState<TenantDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tenantLoading || !tenantId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    tenantDashboardService
      .get(tenantId)
      .then((data) => {
        if (!cancelled) setDashboard(data)
      })
      .catch((error) => {
        if (!(error instanceof ApiError && (error.status === 404 || error.status === 403))) {
          toast.error(errorMessage(error))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tenantId, tenantLoading])

  if (tenantLoading || loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-40 rounded-3xl" />
        <DashboardSkeleton />
      </div>
    )
  }

  if (missing || !tenant || !tenantId || !dashboard) {
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
        description="Your institution at a glance — people, access, and profile health."
        media={
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
            <Building2 className="size-7 text-white" />
          </div>
        }
        badge={<StatusBadge value={tenant.status} />}
        actions={
          <>
            <Button size="sm" className="bg-white/10 text-white hover:bg-white/20" variant="ghost" asChild>
              <Link to="/tenant/users/new">
                <UserPlus />
                Add member
              </Link>
            </Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link to="/tenant/application-access">
                <AppWindow />
                Application access
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Members"
          value={dashboard.membersCount}
          hint="Active institution members"
          icon={Users}
          accent="navy"
          to="/tenant/users"
        />
        <StatCard
          title="Pending invites"
          value={dashboard.pendingInvitations.total}
          hint={`${dashboard.pendingInvitations.admin} admin · ${dashboard.pendingInvitations.member} member`}
          icon={Mail}
          accent="amber"
          to="/tenant/invitations"
        />
        <StatCard
          title="Applications"
          value={dashboard.entitledApplicationsCount}
          hint="Entitled for this institution"
          icon={AppWindow}
          accent="cyan"
          to="/tenant/application-access"
        />
        <StatCard
          title="Entitlements"
          value={dashboard.entitlements.active}
          hint={`${dashboard.entitlements.total} total on record`}
          icon={LayoutGrid}
          accent="violet"
          to="/tenant/application-access"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="portal-card h-full border-border/80">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle>Commercial access</CardTitle>
            <CardDescription>Subscriptions and entitlements from the platform.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Subscriptions</p>
                <SummaryRow label="Total" value={dashboard.subscriptions.total} />
                <SummaryRow label="Active" value={dashboard.subscriptions.active} />
                <SummaryRow label="Inactive" value={dashboard.subscriptions.inactive} />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Entitlements</p>
                <SummaryRow label="Total" value={dashboard.entitlements.total} />
                <SummaryRow label="Active" value={dashboard.entitlements.active} />
                <SummaryRow label="Pending invites" value={dashboard.pendingInvitations.total} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="portal-card h-full border-border/80">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-border/60 pb-4">
            <div>
              <CardTitle>Institution profile</CardTitle>
              <CardDescription>Records maintained for this tenant.</CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/tenant/profile">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileTile to="/tenant/contacts" label="Contacts" count={dashboard.profile.contacts} icon={Users} />
              <ProfileTile to="/tenant/addresses" label="Addresses" count={dashboard.profile.addresses} icon={MapPin} />
              <ProfileTile
                to="/tenant/identifiers"
                label="Identifiers"
                count={dashboard.profile.identifiers}
                icon={BadgeCheck}
              />
              <ProfileTile to="/tenant/assets" label="Assets" count={dashboard.profile.assets} icon={Image} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityCard
          title="Recent members"
          description="Latest people who joined this institution."
          emptyTitle="No members yet"
          emptyDescription="Create a member with credentials or send an email invitation."
          emptyAction={
            <Button size="sm" asChild>
              <Link to="/tenant/users/new">
                <Plus />
                Add member
              </Link>
            </Button>
          }
          viewAllTo="/tenant/users"
          isEmpty={!dashboard.recentMembers.length}
        >
          {dashboard.recentMembers.map((member) => {
            const name = member.userFullName || member.userEmail
            return (
              <Link
                key={member.id}
                to={`/tenant/users/${member.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-accent/35 hover:bg-accent/5 hover:shadow-[0_8px_24px_rgb(0_194_178_/_0.08)]"
              >
                <Avatar size="sm" className="ring-2 ring-background">
                  <AvatarFallback className="bg-primary/8 text-primary">{initialsFromName(name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.userEmail} · joined {formatInvitationInstant(member.joinedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="hidden text-right sm:block">
                    <StatusBadge value={member.status} />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {member.isTenantAdmin ? 'Administrator' : 'Member'}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
              </Link>
            )
          })}
        </ActivityCard>

        <ActivityCard
          title="Recent invitations"
          description="Latest admin and member invitation activity."
          emptyTitle="No invitations yet"
          emptyDescription="Invite administrators or members by email."
          emptyAction={
            <Button size="sm" asChild>
              <Link to="/tenant/invitations">
                <Mail />
                Send invitation
              </Link>
            </Button>
          }
          viewAllTo="/tenant/invitations"
          isEmpty={!dashboard.recentInvitations.length}
        >
          {dashboard.recentInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-3.5 py-3',
                invitation.status === 'PENDING' && 'border-l-[3px] border-l-amber-400',
                invitation.status === 'ACCEPTED' && 'border-l-[3px] border-l-emerald-400',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-xl',
                  invitation.role === MembershipRole.TENANT_ADMIN
                    ? 'bg-[#081b45]/8 text-[#081b45] dark:bg-white/10 dark:text-white'
                    : 'bg-[#00c2b2]/12 text-[#0a7d73] dark:text-[#7ef0e6]',
                )}
              >
                {invitation.role === MembershipRole.TENANT_ADMIN ? (
                  <Building2 className="size-4" />
                ) : (
                  <Users className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{invitation.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {invitation.role === MembershipRole.TENANT_ADMIN ? 'Admin invitation' : 'Member invitation'} · sent{' '}
                  {formatInvitationInstant(invitation.createdAt)}
                </p>
              </div>
              <StatusBadge value={invitation.status} />
            </div>
          ))}
        </ActivityCard>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-80 rounded-2xl" />
        ))}
      </div>
    </>
  )
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  accent,
  to,
}: {
  title: string
  value: number
  hint: string
  icon: LucideIcon
  accent: 'navy' | 'cyan' | 'amber' | 'violet'
  to: string
}) {
  const accents = {
    navy: {
      icon: 'bg-[#081b45]/8 text-[#081b45] dark:bg-white/10 dark:text-white',
      glow: 'from-[#081b45]/10 to-transparent',
    },
    cyan: {
      icon: 'bg-[#00c2b2]/15 text-[#0a7d73] dark:text-[#7ef0e6]',
      glow: 'from-[#00c2b2]/15 to-transparent',
    },
    amber: {
      icon: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
      glow: 'from-amber-500/12 to-transparent',
    },
    violet: {
      icon: 'bg-[#7e14ff]/12 text-[#5c0fbf] dark:text-[#c4a5ff]',
      glow: 'from-[#7e14ff]/12 to-transparent',
    },
  }

  return (
    <Link to={to} className="group block h-full outline-none">
      <Card
        size="sm"
        className="portal-card relative h-full overflow-hidden border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgb(8_27_69_/_0.1)]"
      >
        <div className={cn('absolute inset-x-0 top-0 h-20 bg-gradient-to-b', accents[accent].glow)} />
        <CardHeader className="relative gap-4">
          <div className="flex items-start justify-between gap-3">
            <span className={cn('flex size-10 items-center justify-center rounded-2xl', accents[accent].icon)}>
              <Icon className="size-4.5" />
            </span>
            <ArrowUpRight className="size-4 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <div>
            <CardDescription className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {title}
            </CardDescription>
            <CardTitle className="mt-1 font-display text-4xl font-semibold tracking-tight tabular-nums">
              {value}
            </CardTitle>
            <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function ProfileTile({
  to,
  label,
  count,
  icon: Icon,
}: {
  to: string
  label: string
  count: number
  icon: LucideIcon
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3.5 py-3 transition-colors hover:border-accent/35 hover:bg-accent/5"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{count} record{count === 1 ? '' : 's'}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
    </Link>
  )
}

function ActivityCard({
  title,
  description,
  viewAllTo,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: {
  title: string
  description: string
  viewAllTo: string
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  emptyAction: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="portal-card border-border/80">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-border/60 pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to={viewAllTo}>View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="font-medium">{emptyTitle}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
            <div className="mt-4">{emptyAction}</div>
          </div>
        ) : (
          <div className="space-y-2.5">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
