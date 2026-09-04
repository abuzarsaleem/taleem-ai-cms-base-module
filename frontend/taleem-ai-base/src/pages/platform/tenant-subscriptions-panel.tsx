import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'
import { SectionTitle } from '@/components/section-title'
import { StatusBadge } from '@/components/status-badge'
import { SubscriptionFields } from '@/components/subscription-fields'
import { errorMessage } from '@/lib/auth'
import {
  createSubscriptionPayload,
  emptySubscriptionDraft,
  subscriptionDraftFrom,
  subscriptionPeriodEnded,
  updateSubscriptionPayload,
  validateSubscription,
} from '@/lib/subscription'
import { SubscriptionStatus, type CatalogApplication, type Subscription } from '@/lib/types'
import { labelize } from '@/lib/utils'
import { subscriptionService } from '@/services/platform'

export function TenantSubscriptionsPanel({
  tenantId,
  subscriptions,
  applications,
  onReload,
}: {
  tenantId: string
  subscriptions: Subscription[]
  applications: CatalogApplication[]
  onReload: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptySubscriptionDraft())
  const [busy, setBusy] = useState(false)

  function openCreate() {
    setEditingId(null)
    setDraft(emptySubscriptionDraft())
    setOpen(true)
  }

  async function openEdit(id: string) {
    try {
      const row = await subscriptionService.get(tenantId, id)
      setEditingId(id)
      setDraft(subscriptionDraftFrom(row))
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function save() {
    const error = validateSubscription(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      if (editingId) await subscriptionService.update(tenantId, editingId, updateSubscriptionPayload(draft))
      else await subscriptionService.create(tenantId, createSubscriptionPayload(draft))
      toast.success(editingId ? 'Subscription updated' : 'Subscription created')
      setOpen(false)
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(id: string, status: SubscriptionStatus) {
    try {
      await subscriptionService.update(tenantId, id, { status })
      toast.success(status === SubscriptionStatus.ACTIVE ? 'Subscription activated' : 'Subscription set inactive')
      await onReload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div>
      <SectionTitle
        title="Subscriptions"
        description="POST /tenant/:id/subscription — startDate, endDate, planType, and at least one application code are required. Assigned apps are entitled for this period."
        action={<Button onClick={openCreate}>New subscription</Button>}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit subscription' : 'Create subscription'}</DialogTitle>
            <DialogDescription>
              Assign the applications this tenant can use. Ended periods stay inactive — create a new subscription to
              continue.
            </DialogDescription>
          </DialogHeader>
          <SubscriptionFields value={draft} onChange={setDraft} applications={applications} />
          <DialogFooter>
            <Button disabled={busy || !draft.applicationCodes.length} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={['Code', 'Plan', 'Period', 'Applications', 'Status', '']}
        empty="No subscriptions yet. Assign a plan and applications before inviting a tenant administrator."
        rows={subscriptions.map((row) => [
          row.subscriptionCode,
          `${labelize(row.planType)}${row.billingCycle ? ` · ${labelize(row.billingCycle)}` : ''}`,
          `${row.startDate} → ${row.endDate}`,
          row.applicationCodes.length ? row.applicationCodes.join(', ') : '—',
          <StatusBadge key={row.id} value={row.status} />,
          <div key={`${row.id}-actions`} className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => void openEdit(row.id)}>
              Edit
            </Button>
            {row.status === SubscriptionStatus.ACTIVE ? (
              <Button size="sm" variant="outline" onClick={() => void setStatus(row.id, SubscriptionStatus.INACTIVE)}>
                Inactive
              </Button>
            ) : subscriptionPeriodEnded(row.endDate) ? (
              <span className="text-xs text-muted-foreground">Ended</span>
            ) : (
              <Button size="sm" variant="outline" onClick={() => void setStatus(row.id, SubscriptionStatus.ACTIVE)}>
                Activate
              </Button>
            )}
          </div>,
        ])}
      />
    </div>
  )
}
