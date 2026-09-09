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
import { ContactFields } from '@/components/contact-fields'
import { DataTable } from '@/components/data-table'
import { RowActions } from '@/components/row-actions'
import { SectionTitle } from '@/components/section-title'
import { errorMessage } from '@/lib/auth'
import { contactDraftFrom, contactPayload, emptyContactDraft, validateContact } from '@/lib/contact'
import { labelize } from '@/lib/utils'
import type { TenantContact } from '@/lib/types'
import { tenantContactService } from '@/services/platform'

export function TenantContactsPanel({
  tenantId,
  contacts,
  onReload,
}: {
  tenantId: string
  contacts: TenantContact[]
  onReload: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyContactDraft())
  const [busy, setBusy] = useState(false)

  async function openCreate() {
    setEditingId(null)
    setDraft(emptyContactDraft())
    setOpen(true)
  }

  async function openEdit(id: string) {
    try {
      const row = await tenantContactService.get(tenantId, id)
      setEditingId(id)
      setDraft(contactDraftFrom(row))
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function save() {
    const error = validateContact(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      if (editingId) await tenantContactService.update(tenantId, editingId, contactPayload(draft))
      else await tenantContactService.create(tenantId, contactPayload(draft))
      toast.success(editingId ? 'Contact updated' : 'Contact added')
      setOpen(false)
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="pb-8">
      <SectionTitle
        title="Contacts"
        description="POST/PATCH /tenant/:id/contact — first name and contact type are required."
        action={<Button onClick={() => void openCreate()}>Add contact</Button>}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit contact' : 'Add contact'}</DialogTitle>
            <DialogDescription>
              Required: contactType, firstName. Optional: names, designation, department, phones, WhatsApp, email,
              isPrimary, isActive.
            </DialogDescription>
          </DialogHeader>
          <ContactFields value={draft} onChange={setDraft} />
          <DialogFooter>
            <Button disabled={busy || !draft.firstName.trim()} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={['Name', 'Email', 'Type', 'Primary', 'Active', '']}
        empty="No contacts yet."
        rows={contacts.map((row) => [
          `${row.firstName} ${row.middleName ?? ''} ${row.lastName ?? ''}`.replace(/\s+/g, ' ').trim(),
          row.email ?? '—',
          labelize(row.contactType),
          row.isPrimary ? 'Yes' : 'No',
          row.isActive ? 'Yes' : 'No',
          <RowActions
            key={row.id}
            onEdit={() => void openEdit(row.id)}
            onDelete={() =>
              void tenantContactService
                .delete(tenantId, row.id)
                .then(() => {
                  toast.success('Contact removed')
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
