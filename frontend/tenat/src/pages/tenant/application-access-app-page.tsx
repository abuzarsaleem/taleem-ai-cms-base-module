import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { DataTable } from '@/components/data-table'
import { EmptyState, PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/section-title'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { formatInvitationInstant } from '@/lib/invitation'
import { useOwnTenant } from '@/lib/use-own-tenant'
import {
  ApplicationAccessStatus,
  type ApplicationAccessAssignment,
  type ApplicationRole,
  type TenantMembership,
} from '@/lib/types'
import { applicationAccessService, membershipService } from '@/services/platform'

export function TenantApplicationAccessAppPage() {
  const { applicationId = '' } = useParams()
  const { tenantId, tenant, loading: tenantLoading, missing } = useOwnTenant()
  const [roles, setRoles] = useState<ApplicationRole[]>([])
  const [members, setMembers] = useState<TenantMembership[]>([])
  const [rows, setRows] = useState<ApplicationAccessAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const app = tenant?.applications?.find((item) => item.applicationId === applicationId)
  const applicationCode = app?.applicationCode
  const rolesPath = `/tenant/application-access/${applicationId}/roles`

  const reload = useCallback(async () => {
    if (!tenantId || !applicationId || !applicationCode) return
    const [nextRoles, membershipPage, accessPage] = await Promise.all([
      applicationAccessService.roles(tenantId, applicationCode),
      membershipService.list(tenantId),
      applicationAccessService.list(tenantId, { applicationId }),
    ])
    setRoles(nextRoles)
    setMembers(membershipPage.data)
    setRows(accessPage.data)
  }, [applicationCode, applicationId, tenantId])

  useEffect(() => {
    if (tenantLoading) return
    if (!tenantId || !applicationCode) {
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
  }, [applicationCode, reload, tenantId, tenantLoading])

  function memberLabel(userId: string) {
    const member = members.find((row) => row.userId === userId)
    if (!member) return userId
    return member.userFullName || member.userEmail || userId
  }

  async function runAssignment(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id)
    try {
      await action()
      toast.success(success)
      await reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  const activeRows = rows.filter((row) => row.status !== ApplicationAccessStatus.REVOKED)

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

  if (!app) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Button variant="outline" className="w-fit" asChild>
          <Link to="/tenant/application-access">
            <ArrowLeft />
            Back to application access
          </Link>
        </Button>
        <EmptyState
          title="Application not assigned"
          description="This application is not entitled for your institution."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={app.applicationCode}
        title={app.name}
        description="Application details and members who can access it."
        media={
          <div className="rounded-2xl bg-white p-1 shadow-sm">
            <ApplicationIcon
              code={app.applicationCode}
              logoUrl={app.logoUrl}
              className="size-14 rounded-[0.9rem]"
            />
          </div>
        }
        toolbar={
          <p className="text-sm text-muted-foreground">
            {activeRows.length} member{activeRows.length === 1 ? '' : 's'} assigned
          </p>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/tenant/application-access">
                <ArrowLeft />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={rolesPath}>
                <ShieldCheck />
                View roles & permissions
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/tenant/application-access/new?applicationId=${app.applicationId}`}>Assign access</Link>
            </Button>
          </>
        }
      />

      <section className="portal-card p-5 sm:p-6">
        <SectionTitle title="Application details" description="Entitlement information for this institution." />
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Application code</dt>
            <dd className="mt-1 font-mono text-sm">{app.applicationCode}</dd>
          </div>
          {app.launchUrl ? (
            <div>
              <dt className="text-xs text-muted-foreground">Launch URL</dt>
              <dd className="mt-1 truncate text-sm">{app.launchUrl}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs text-muted-foreground">Effective from</dt>
            <dd className="mt-1 text-sm">{formatInvitationInstant(app.effectiveFrom)}</dd>
          </div>
          {app.effectiveUntil ? (
            <div>
              <dt className="text-xs text-muted-foreground">Effective until</dt>
              <dd className="mt-1 text-sm">{formatInvitationInstant(app.effectiveUntil)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="portal-card p-5 sm:p-6">
        <SectionTitle title="Assigned members" description="Change roles or remove access for this application." />
        <DataTable
          columns={['Member', 'Role', 'Status', 'Default', '']}
          empty="No members have been assigned this application yet."
          rows={activeRows.map((row) => {
            const member = members.find((item) => item.userId === row.userId)
            const rowBusy = busyId === row.id
            return [
              <div key={`${row.id}-member`}>
                <p className="font-medium">{memberLabel(row.userId)}</p>
                <p className="text-xs text-muted-foreground">{member?.userEmail ?? row.userId}</p>
              </div>,
              <Select
                key={`${row.id}-role`}
                value={row.roleId}
                disabled={rowBusy}
                onValueChange={(roleId) => {
                  if (roleId === row.roleId) return
                  void runAssignment(
                    row.id,
                    () => applicationAccessService.update(tenantId, row.id, { roleId }),
                    'Role updated',
                  )
                }}
              >
                <SelectTrigger size="sm" className="w-[11rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>,
              <StatusBadge key={`${row.id}-status`} value={row.status} />,
              row.isDefault ? 'Yes' : 'No',
              <div key={`${row.id}-actions`} className="flex justify-end gap-2">
                {!row.isDefault ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rowBusy}
                    onClick={() =>
                      void runAssignment(
                        row.id,
                        () => applicationAccessService.update(tenantId, row.id, { isDefault: true }),
                        'Set as default landing app',
                      )
                    }
                  >
                    Set default
                  </Button>
                ) : null}
                {member ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/tenant/users/${member.id}`}>View details</Link>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rowBusy}
                  onClick={() =>
                    void runAssignment(
                      row.id,
                      () =>
                        applicationAccessService.update(tenantId, row.id, {
                          status: ApplicationAccessStatus.REVOKED,
                        }),
                      'Access removed',
                    )
                  }
                >
                  Remove
                </Button>
              </div>,
            ]
          })}
        />
      </div>
    </div>
  )
}
