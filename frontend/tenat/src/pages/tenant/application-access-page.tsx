import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { DataTable } from '@/components/data-table'
import { EmptyState, PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { useOwnTenant } from '@/lib/use-own-tenant'
import { MembershipStatus, type ApplicationAccessAssignment, type TenantMembership } from '@/lib/types'
import { applicationAccessService, membershipService } from '@/services/platform'

export function TenantApplicationAccessPage() {
  const { tenantId, tenant, loading: tenantLoading, missing } = useOwnTenant()
  const [members, setMembers] = useState<TenantMembership[]>([])
  const [rows, setRows] = useState<ApplicationAccessAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const applications = tenant?.applications ?? []
  const activeMembers = useMemo(
    () => members.filter((row) => row.status === MembershipStatus.ACTIVE),
    [members],
  )

  const reload = useCallback(async () => {
    if (!tenantId) return
    const [membershipPage, accessPage] = await Promise.all([
      membershipService.list(tenantId),
      applicationAccessService.list(tenantId),
    ])
    setMembers(membershipPage.data)
    setRows(accessPage.data)
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    reload()
      .catch((error) => {
        if (!(error instanceof ApiError && (error.status === 404 || error.status === 403))) {
          toast.error(errorMessage(error))
        }
      })
      .finally(() => setLoading(false))
  }, [reload, tenantId])

  function memberLabel(userId: string) {
    const member = members.find((row) => row.userId === userId)
    if (!member) return userId
    return member.userFullName || member.userEmail || userId
  }

  function logoFor(applicationId: string) {
    return applications.find((app) => app.applicationId === applicationId)?.logoUrl
  }

  if (tenantLoading || loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (missing || !tenant || !tenantId) {
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
        title="Application access"
        description="See the roles and permissions available on each entitled application, then assign a member to one of those roles."
        actions={
          applications.length && activeMembers.length ? (
            <Button asChild>
              <Link to="/tenant/application-access/new">Assign access</Link>
            </Button>
          ) : (
            <Button disabled>Assign access</Button>
          )
        }
      />

      {!applications.length ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No applications are assigned to this institution yet. A platform administrator must entitle applications
          through a subscription.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {applications.map((app) => (
            <Link
              key={app.applicationId}
              to={`/tenant/application-access/${app.applicationId}`}
              className="portal-card flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--portal-shadow)]"
            >
              <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{app.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{app.applicationCode}</p>
                <p className="mt-1 text-xs text-muted-foreground">Roles and permissions</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      <div className="portal-card p-5 sm:p-6">
        <DataTable
          columns={['Member', 'Application', 'Role', 'Status', 'Default', '']}
          empty="No application access assigned yet."
          rows={rows.map((row) => [
            <div key={`${row.id}-member`}>
              <p className="font-medium">{memberLabel(row.userId)}</p>
              <p className="text-xs text-muted-foreground">
                {members.find((member) => member.userId === row.userId)?.userEmail ?? row.userId}
              </p>
            </div>,
            <div key={`${row.id}-app`} className="flex items-center gap-2">
              <ApplicationIcon
                code={row.applicationCode ?? ''}
                logoUrl={logoFor(row.applicationId)}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{row.applicationName ?? '—'}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{row.applicationCode ?? '—'}</p>
              </div>
            </div>,
            row.roleName ?? row.roleCode ?? '—',
            <StatusBadge key={`${row.id}-status`} value={row.status} />,
            row.isDefault ? 'Yes' : 'No',
            <Button key={`${row.id}-edit`} size="sm" variant="outline" asChild>
              <Link to={`/tenant/application-access/assignments/${row.id}`}>Edit</Link>
            </Button>,
          ])}
        />
      </div>
    </div>
  )
}
