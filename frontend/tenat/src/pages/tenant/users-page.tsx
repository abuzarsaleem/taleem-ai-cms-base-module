import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTable } from '@/components/data-table'
import { EmptyState, PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage, useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { formatInvitationInstant } from '@/lib/invitation'
import { initialsFromName } from '@/lib/utils'
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
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return members.filter((row) => {
      if (roleFilter === MembershipRole.TENANT_ADMIN && !row.isTenantAdmin) return false
      if (roleFilter === MembershipRole.TENANT_MEMBER && row.isTenantAdmin) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!needle) return true
      return (
        row.userFullName?.toLowerCase().includes(needle) ||
        row.userEmail.toLowerCase().includes(needle)
      )
    })
  }, [members, query, roleFilter, statusFilter])

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
        description="People who belong to this institution. Open a profile to manage roles, status, and application access."
        toolbar={
          <>
            <Input
              className="max-w-sm"
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[10.5rem]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value={MembershipRole.TENANT_ADMIN}>Administrators</SelectItem>
                <SelectItem value={MembershipRole.TENANT_MEMBER}>Members</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[10.5rem]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value={MembershipStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={MembershipStatus.SUSPENDED}>Suspended</SelectItem>
                <SelectItem value={MembershipStatus.INACTIVE}>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/tenant/invitations">Pending invitations</Link>
            </Button>
            <Button asChild>
              <Link to="/tenant/users/new">Add member</Link>
            </Button>
          </>
        }
      />

      <div className="portal-card p-5 sm:p-6">
        <DataTable
          columns={['Member', 'Role', 'Status', 'Joined', '']}
          empty="No members match your filters."
          rows={filtered.map((row) => {
            const displayName = row.userFullName || row.userEmail
            const self = row.userId === currentUserId
            return [
              <div key={`${row.id}-who`} className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>{initialsFromName(displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.userEmail}
                    {self ? ' · you' : ''}
                  </p>
                </div>
              </div>,
              row.isTenantAdmin ? 'Tenant administrator' : 'Tenant member',
              <StatusBadge key={`${row.id}-status`} value={row.status} />,
              formatInvitationInstant(row.joinedAt),
              <div key={`${row.id}-actions`} className="flex justify-end">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/tenant/users/${row.id}`}>View details</Link>
                </Button>
              </div>,
            ]
          })}
        />
      </div>
    </div>
  )
}
