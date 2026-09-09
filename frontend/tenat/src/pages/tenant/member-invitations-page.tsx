import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CreateMembershipDialog } from '@/components/create-membership-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { errorMessage, useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import type { AdminInvitation, Tenant } from '@/lib/types'
import { memberInvitationService, membershipService, tenantService } from '@/services/platform'
import { TenantInvitationsPanel } from '@/pages/tenant/invitations-panel'

export function TenantMemberInvitationsPage() {
  const { session } = useAuth()
  const tenantId = session?.tenantId
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(!tenantId)
  const [createOpen, setCreateOpen] = useState(false)

  const reload = useCallback(async () => {
    if (!tenantId) {
      setMissing(true)
      return
    }
    const [nextTenant, page] = await Promise.all([
      tenantService.get(tenantId),
      memberInvitationService.list(tenantId),
    ])
    setTenant(nextTenant)
    setInvitations(page.data)
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
        title="Member invitations"
        description="Invite tenant members by email, or create them directly with credentials on the Members page."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/tenant/users">View members</Link>
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Create member</Button>
          </>
        }
      />
      <CreateMembershipDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create tenant member"
        description="Provisions the account and adds an active tenant member membership. The person can sign in immediately with these credentials."
        submitLabel="Create member"
        onSubmit={async (body) => {
          await membershipService.create(tenantId, body)
          toast.success('Member created')
          await reload()
        }}
      />
      <div className="portal-card p-5 sm:p-6">
        <TenantInvitationsPanel
          tenantId={tenant.id}
          invitations={invitations}
          service={memberInvitationService}
          title="Tenant member invitations"
          description="POST /tenant/:id/member-invitation — email only. Accepted users join as tenant members. Promote them on the Members page."
          dialogTitle="Invite tenant member"
          dialogDescription="Only an email address is sent. The person joins as a tenant member, not an administrator. A pending invite or an already active member is rejected."
          empty="No member invitations yet."
          onReload={reload}
        />
      </div>
    </div>
  )
}
