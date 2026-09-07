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
import { AddressFields } from '@/components/address-fields'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { SectionTitle } from '@/components/section-title'
import { addressDraftFrom, addressPayload, emptyAddressDraft, validateAddress } from '@/lib/address'
import { errorMessage } from '@/lib/auth'
import { labelize } from '@/lib/utils'
import type { TenantAddress } from '@/lib/types'
import { tenantAddressService } from '@/services/platform'

export function TenantAddressesPanel({
  tenantId,
  addresses,
  onReload,
}: {
  tenantId: string
  addresses: TenantAddress[]
  onReload: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyAddressDraft())
  const [busy, setBusy] = useState(false)

  async function openCreate() {
    setEditingId(null)
    setDraft({ ...emptyAddressDraft(), isPrimary: addresses.length === 0 })
    setOpen(true)
  }

  async function openEdit(id: string) {
    try {
      const row = await tenantAddressService.get(tenantId, id)
      setEditingId(id)
      setDraft(addressDraftFrom(row))
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function save() {
    const error = validateAddress(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      if (editingId) await tenantAddressService.update(tenantId, editingId, addressPayload(draft))
      else await tenantAddressService.create(tenantId, addressPayload(draft))
      toast.success(editingId ? 'Address updated' : 'Address added')
      setOpen(false)
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="py-8">
      <SectionTitle
        title="Addresses"
        description="POST/PATCH /tenant/:id/address — type, line 1, and city are required."
        action={<Button onClick={() => void openCreate()}>Add address</Button>}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit address' : 'Add address'}</DialogTitle>
            <DialogDescription>
              Required: addressType, addressLine1, city. Country defaults to PK.
            </DialogDescription>
          </DialogHeader>
          <AddressFields value={draft} onChange={setDraft} />
          <DialogFooter>
            <Button disabled={busy || !draft.addressLine1.trim() || !draft.city.trim()} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={['Address', 'City', 'Type', 'Primary', 'Active', '']}
        empty="No addresses yet."
        rows={addresses.map((row) => [
          row.addressLine1,
          row.city,
          labelize(row.addressType),
          row.isPrimary ? 'Yes' : 'No',
          row.isActive ? 'Yes' : 'No',
          <RowActions
            key={row.id}
            onEdit={() => void openEdit(row.id)}
            onDelete={() =>
              void tenantAddressService
                .delete(tenantId, row.id)
                .then(() => {
                  toast.success('Address removed')
                  return onReload()
                })
                .catch((error) => toast.error(errorMessage(error)))
            }
          />,
        ])}
      />
    </section>
  )
}
