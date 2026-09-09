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
import { IdentifierFields } from '@/components/identifier-fields'
import { RowActions } from '@/components/row-actions'
import { SectionTitle } from '@/components/section-title'
import { errorMessage } from '@/lib/auth'
import { emptyIdentifierDraft, identifierDraftFrom, identifierPayload, validateIdentifier } from '@/lib/identifier'
import { labelize } from '@/lib/utils'
import type { TenantIdentifier } from '@/lib/types'
import { tenantIdentifierService } from '@/services/platform'

export function TenantIdentifiersPanel({
  tenantId,
  identifiers,
  onReload,
}: {
  tenantId: string
  identifiers: TenantIdentifier[]
  onReload: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyIdentifierDraft())
  const [busy, setBusy] = useState(false)

  function openCreate() {
    setEditingId(null)
    setDraft(emptyIdentifierDraft())
    setOpen(true)
  }

  async function openEdit(id: string) {
    try {
      const row = await tenantIdentifierService.get(tenantId, id)
      setEditingId(id)
      setDraft(identifierDraftFrom(row))
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function save() {
    const error = validateIdentifier(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const payload = identifierPayload(draft, editingId ? 'update' : 'create')
      if (editingId) await tenantIdentifierService.update(tenantId, editingId, payload)
      else await tenantIdentifierService.create(tenantId, payload)
      toast.success(editingId ? 'Identifier updated' : 'Identifier added')
      setOpen(false)
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="pt-8">
      <SectionTitle
        title="Identifiers"
        description="POST/PATCH /tenant/:id/identifier — type must match GET /catalog/identifier-type."
        action={<Button onClick={openCreate}>Add identifier</Button>}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit identifier' : 'Add identifier'}</DialogTitle>
            <DialogDescription>Type and value are required. Verified is only sent on update.</DialogDescription>
          </DialogHeader>
          <IdentifierFields value={draft} onChange={setDraft} showVerified={Boolean(editingId)} />
          <DialogFooter>
            <Button disabled={busy || !draft.identifierValue.trim()} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save identifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={['Type', 'Value', 'Authority', 'Verified', '']}
        empty="No identifiers yet."
        rows={identifiers.map((row) => [
          labelize(row.identifierType),
          row.identifierValue,
          row.issuingAuthority ?? '—',
          row.isVerified ? 'Yes' : 'No',
          <RowActions
            key={row.id}
            onEdit={() => void openEdit(row.id)}
            onDelete={() =>
              void tenantIdentifierService
                .delete(tenantId, row.id)
                .then(() => {
                  toast.success('Identifier removed')
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
