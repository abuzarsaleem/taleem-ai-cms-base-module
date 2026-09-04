import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/data-table'
import { EmptyState, PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage, useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { formatInvitationInstant } from '@/lib/invitation'
import {
  MembershipRole,
  MembershipStatus,
  type Tenant,
  type TenantMembership,
} from '@/lib/types'
import { membershipService, tenantService } from '@/services/platform'

export function TenantUsersPage() {
  const { session } = useAuth()
  const tenantId = session?.tenantId
  const currentUserId = session?.user.id
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [members, setMembers] = useState<TenantMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(!tenantId)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!tenantId) {
      setMissing(true)
      return
    }
    const [nextTenant, page] = await Promise.all([
      tenantService.get(tenantId),
      membershipService.list(tenantId),
    ])
    setTenant(nextTenant)
    setMembers(page.data)
    setMissing(false)
  }, [tenantId])

  useEffect(() => {
    setLoading(true)
    reload()
      .catch((error) => {
        if (error instanceof ApiError && (error.status === 404 || error.status === 403)) setMissing(true)
        else toast.error(errorMessage(error))
      })
      .finally(() => setLoading(false))
  }, [reload])

  const activeAdmins = members.filter(
    (row) => row.isTenantAdmin && row.status === MembershipStatus.ACTIVE,
  ).length

  async function run(id: string, action: () => Promise<unknown>, success: string) {
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

  if (loading) {
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
        title="Members"
        description="GET/PATCH/DELETE /tenant/:id/membership — roles are tenant administrator or tenant member. Suspend instead of setting inactive."
      />
      <div className="portal-card p-5 sm:p-6">
        <DataTable
          columns={['Member', 'Role', 'Status', 'Joined', '']}
          empty="No members yet. Invite people from the Invitations page."
          rows={members.map((row) => {
            const lastAdmin = row.isTenantAdmin && activeAdmins <= 1
            const busy = busyId === row.id
            const self = row.userId === currentUserId
            return [
              <div key={`${row.id}-who`}>
                <p className="font-medium">{row.userFullName || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {row.userEmail}
                  {self ? ' · you' : ''}
                </p>
              </div>,
              <Select
                key={`${row.id}-role`}
                value={row.isTenantAdmin ? MembershipRole.TENANT_ADMIN : MembershipRole.TENANT_MEMBER}
                disabled={busy || (lastAdmin && row.isTenantAdmin)}
                onValueChange={(value) => {
                  const isTenantAdmin = value === MembershipRole.TENANT_ADMIN
                  if (isTenantAdmin === row.isTenantAdmin) return
                  void run(
                    row.id,
                    () => membershipService.update(tenantId, row.id, { isTenantAdmin }),
                    isTenantAdmin ? 'Promoted to tenant administrator' : 'Changed to tenant member',
                  )
                }}
              >
                <SelectTrigger size="sm" className="w-[11.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MembershipRole.TENANT_ADMIN}>Tenant administrator</SelectItem>
                  <SelectItem value={MembershipRole.TENANT_MEMBER}>Tenant member</SelectItem>
                </SelectContent>
              </Select>,
              <StatusBadge key={`${row.id}-status`} value={row.status} />,
              formatInvitationInstant(row.joinedAt),
              <div key={`${row.id}-actions`} className="flex justify-end gap-2">
                {row.status === MembershipStatus.SUSPENDED ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        row.id,
                        () => membershipService.update(tenantId, row.id, { status: MembershipStatus.ACTIVE }),
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
                        row.id,
                        () => membershipService.update(tenantId, row.id, { status: MembershipStatus.SUSPENDED }),
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
                  disabled={busy || lastAdmin}
                  onClick={() =>
                    void run(row.id, () => membershipService.remove(tenantId, row.id), 'Member removed')
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
