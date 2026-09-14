import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { DataTable } from '@/components/data-table'
import { Field } from '@/components/field'
import { EmptyState, PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/section-title'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage, useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { formatInvitationInstant } from '@/lib/invitation'
import { initialsFromName } from '@/lib/utils'
import { useOwnTenant } from '@/lib/use-own-tenant'
import {
  ApplicationAccessStatus,
  MembershipRole,
  MembershipStatus,
  type ApplicationAccessAssignment,
  type ApplicationRole,
  type TenantMembership,
} from '@/lib/types'
import { applicationAccessService, membershipService } from '@/services/platform'

export function TenantMemberProfilePage() {
  const { membershipId = '' } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { tenantId, tenant, loading: tenantLoading, missing } = useOwnTenant()
  const currentUserId = session?.user.id

  const [member, setMember] = useState<TenantMembership | null>(null)
  const [allMembers, setAllMembers] = useState<TenantMembership[]>([])
  const [assignments, setAssignments] = useState<ApplicationAccessAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignAppId, setAssignAppId] = useState('')
  const [assignRoleId, setAssignRoleId] = useState('')
  const [assignRoles, setAssignRoles] = useState<ApplicationRole[]>([])
  const [assignBusy, setAssignBusy] = useState(false)

  const applications = tenant?.applications ?? []
  const activeAdmins = useMemo(
    () => allMembers.filter((row) => row.isTenantAdmin && row.status === MembershipStatus.ACTIVE).length,
    [allMembers],
  )

  const [rolesByApp, setRolesByApp] = useState<Record<string, ApplicationRole[]>>({})

  const reload = useCallback(async () => {
    if (!tenantId || !membershipId) return
    const nextMember = await membershipService.get(tenantId, membershipId)
    const [membershipPage, accessPage] = await Promise.all([
      membershipService.list(tenantId),
      applicationAccessService.list(tenantId, { userId: nextMember.userId }),
    ])
    setMember(nextMember)
    setAllMembers(membershipPage.data)
    setAssignments(accessPage.data)
  }, [membershipId, tenantId])

  useEffect(() => {
    if (tenantLoading || !tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    reload()
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) {
          navigate('/tenant/users', { replace: true })
        }
      })
      .finally(() => setLoading(false))
  }, [navigate, reload, tenantId, tenantLoading])

  useEffect(() => {
    if (!tenantId || !assignAppId) {
      setAssignRoles([])
      setAssignRoleId('')
      return
    }
    const app = applications.find((item) => item.applicationId === assignAppId)
    if (!app) return
    let cancelled = false
    applicationAccessService
      .roles(tenantId, app.applicationCode)
      .then((roles) => {
        if (cancelled) return
        setAssignRoles(roles)
        setAssignRoleId(roles[0]?.id ?? '')
      })
      .catch((error) => toast.error(errorMessage(error)))
    return () => {
      cancelled = true
    }
  }, [applications, assignAppId, tenantId])

  useEffect(() => {
    if (!tenantId || !applications.length) return
    let cancelled = false
    Promise.all(
      applications.map(async (app) => {
        const roles = await applicationAccessService.roles(tenantId, app.applicationCode)
        return [app.applicationId, roles] as const
      }),
    )
      .then((entries) => {
        if (!cancelled) setRolesByApp(Object.fromEntries(entries))
      })
      .catch((error) => toast.error(errorMessage(error)))
    return () => {
      cancelled = true
    }
  }, [applications, tenantId])

  const assignedAppIds = useMemo(
    () =>
      new Set(
        assignments.filter((row) => row.status !== ApplicationAccessStatus.REVOKED).map((row) => row.applicationId),
      ),
    [assignments],
  )

  const availableApps = applications.filter((app) => !assignedAppIds.has(app.applicationId))

  async function run(action: () => Promise<unknown>, success: string, id = 'member') {
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

  async function assignApplication() {
    if (!tenantId || !member || !assignAppId || !assignRoleId) {
      toast.error('Choose an application and role')
      return
    }
    setAssignBusy(true)
    try {
      await applicationAccessService.create(tenantId, {
        userId: member.userId,
        applicationId: assignAppId,
        roleId: assignRoleId,
        isDefault: assignments.length === 0,
      })
      toast.success('Application access assigned')
      setAssignOpen(false)
      setAssignAppId('')
      await reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setAssignBusy(false)
    }
  }

  if (tenantLoading || loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (missing || !tenant || !tenantId || !member) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <EmptyState
          title="Member not found"
          description="This membership may have been removed or you do not have access."
        />
        <Button className="w-fit" variant="outline" asChild>
          <Link to="/tenant/users">Back to members</Link>
        </Button>
      </div>
    )
  }

  const lastAdmin = member.isTenantAdmin && activeAdmins <= 1
  const self = member.userId === currentUserId
  const busy = busyId === 'member'
  const displayName = member.userFullName || member.userEmail
  const activeAssignments = assignments.filter((row) => row.status !== ApplicationAccessStatus.REVOKED)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={tenant.tenantCode}
        title={displayName}
        description={member.userEmail}
        media={
          <Avatar size="lg" className="size-14">
            <AvatarFallback className="text-base">{initialsFromName(displayName)}</AvatarFallback>
          </Avatar>
        }
        toolbar={
          <p className="text-sm text-muted-foreground">
            Joined {formatInvitationInstant(member.joinedAt)}
            {self ? ' · you' : ''}
          </p>
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/tenant/users">
              <ArrowLeft />
              Back to members
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
        <section className="portal-card space-y-5 p-5 sm:p-6">
          <SectionTitle title="Membership" description="Tenant role and account status for this person." />
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={member.status} />
            <Select
              value={member.isTenantAdmin ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_MEMBER}
              disabled={busy || (lastAdmin && member.isTenantAdmin)}
              onValueChange={(value) => {
                const isTenantAdmin = value === MembershipRole.TENANT_ADMIN
                if (isTenantAdmin === member.isTenantAdmin) return
                void run(
                  () => membershipService.update(tenantId, member.id, { isTenantAdmin }),
                  isTenantAdmin ? 'Promoted to tenant administrator' : 'Changed to tenant member',
                )
              }}
            >
              <SelectTrigger className="w-[13rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MembershipRole.TENANT_ADMIN}>Tenant administrator</SelectItem>
                <SelectItem value={MembershipRole.TENANT_MEMBER}>Tenant member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {member.status === MembershipStatus.SUSPENDED ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => membershipService.update(tenantId, member.id, { status: MembershipStatus.ACTIVE }),
                    'Membership activated',
                  )
                }
              >
                Activate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={busy || lastAdmin}
                onClick={() =>
                  void run(
                    () => membershipService.update(tenantId, member.id, { status: MembershipStatus.SUSPENDED }),
                    'Membership suspended',
                  )
                }
              >
                Suspend
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy || lastAdmin || self}
              onClick={() => {
                void (async () => {
                  setBusyId('member')
                  try {
                    await membershipService.remove(tenantId, member.id)
                    toast.success('Member removed')
                    navigate('/tenant/users')
                  } catch (error) {
                    toast.error(errorMessage(error))
                  } finally {
                    setBusyId(null)
                  }
                })()
              }}
            >
              Remove member
            </Button>
          </div>
        </section>

        <section className="portal-card p-5 sm:p-6">
          <SectionTitle title="Summary" description="Application access at a glance." />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Active apps</dt>
              <dd className="font-medium">{activeAssignments.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Default app</dt>
              <dd className="truncate font-medium">
                {activeAssignments.find((row) => row.isDefault)?.applicationName ?? '—'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="portal-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <SectionTitle
            title="Application access"
            description="Roles and landing app for each entitled application."
          />
          <Button
            size="sm"
            disabled={!availableApps.length}
            onClick={() => {
              setAssignAppId(availableApps[0]?.applicationId ?? '')
              setAssignOpen(true)
            }}
          >
            <Plus />
            Assign application
          </Button>
        </div>
        <DataTable
          columns={['Application', 'Role', 'Status', 'Default', '']}
          empty="No application access assigned yet."
          rows={activeAssignments.map((row) => {
            const app = applications.find((item) => item.applicationId === row.applicationId)
            const rowBusy = busyId === row.id
            return [
              <div key={`${row.id}-app`} className="flex items-center gap-2">
                <ApplicationIcon
                  code={row.applicationCode ?? app?.applicationCode ?? ''}
                  logoUrl={app?.logoUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.applicationName ?? app?.name ?? '—'}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {row.applicationCode ?? app?.applicationCode ?? '—'}
                  </p>
                </div>
              </div>,
              <Select
                key={`${row.id}-role`}
                value={row.roleId}
                disabled={rowBusy}
                onValueChange={(roleId) => {
                  if (roleId === row.roleId) return
                  void run(
                    () => applicationAccessService.update(tenantId, row.id, { roleId }),
                    'Role updated',
                    row.id,
                  )
                }}
              >
                <SelectTrigger size="sm" className="w-[11rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(rolesByApp[row.applicationId] ?? []).map((role) => (
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
                      void run(
                        () => applicationAccessService.update(tenantId, row.id, { isDefault: true }),
                        'Set as default landing app',
                        row.id,
                      )
                    }
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rowBusy}
                  onClick={() =>
                    void run(
                      () =>
                        applicationAccessService.update(tenantId, row.id, {
                          status: ApplicationAccessStatus.REVOKED,
                        }),
                      'Access removed',
                      row.id,
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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign application</DialogTitle>
            <DialogDescription>
              Grant {member.userFullName || member.userEmail} access to an entitled application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Application" required>
              <Select
                value={assignAppId || undefined}
                onValueChange={(value) => {
                  setAssignAppId(value)
                  setAssignRoleId('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {availableApps.map((app) => (
                    <SelectItem key={app.applicationId} value={app.applicationId}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Role" required>
              <Select value={assignRoleId || undefined} onValueChange={setAssignRoleId} disabled={!assignRoles.length}>
                <SelectTrigger>
                  <SelectValue placeholder={assignRoles.length ? 'Select role' : 'Loading roles…'} />
                </SelectTrigger>
                <SelectContent>
                  {assignRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button
              disabled={assignBusy || !assignAppId || !assignRoleId}
              onClick={() => void assignApplication()}
            >
              {assignBusy ? 'Assigning…' : 'Assign access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
