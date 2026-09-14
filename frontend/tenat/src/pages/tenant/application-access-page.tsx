import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { DataTable } from '@/components/data-table'
import { EmptyState, PageHeader } from '@/components/page-header'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { formatInvitationInstant } from '@/lib/invitation'
import { useOwnTenant } from '@/lib/use-own-tenant'
import {
  ApplicationAccessStatus,
  MembershipStatus,
  type ApplicationAccessAssignment,
  type TenantMembership,
} from '@/lib/types'
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

  const memberCountByApp = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of rows) {
      if (row.status === ApplicationAccessStatus.REVOKED) continue
      counts.set(row.applicationId, (counts.get(row.applicationId) ?? 0) + 1)
    }
    return counts
  }, [rows])

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
        description="Entitled applications for this institution. Open an application to manage assigned members."
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

      <div className="portal-card p-5 sm:p-6">
        <DataTable
          columns={['Application', 'Code', 'Effective from', 'Members', '']}
          empty="No applications are assigned to this institution yet. A platform administrator must entitle applications through a subscription."
          rows={applications.map((app) => {
            const memberCount = memberCountByApp.get(app.applicationId) ?? 0
            return [
              <div key={`${app.applicationId}-app`} className="flex items-center gap-2">
                <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                <p className="truncate font-medium">{app.name}</p>
              </div>,
              <span key={`${app.applicationId}-code`} className="font-mono text-[11px] text-muted-foreground">
                {app.applicationCode}
              </span>,
              formatInvitationInstant(app.effectiveFrom),
              `${memberCount} member${memberCount === 1 ? '' : 's'}`,
              <div key={`${app.applicationId}-actions`} className="flex justify-end">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/tenant/application-access/${app.applicationId}`}>View details</Link>
                </Button>
              </div>,
            ]
          })}
        />
      </div>
    </div>
  )
}
