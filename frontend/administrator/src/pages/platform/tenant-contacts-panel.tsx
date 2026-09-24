import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ContactFields } from '@/components/contact-fields'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { contactDraftFrom, contactFieldErrors, contactPayload, emptyContactDraft, type ContactDraft } from '@/lib/contact'
import { labelize } from '@/lib/utils'
import { ContactType, type TenantContact } from '@/lib/types'
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
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDraft, string>>>({})
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | ContactType>('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts.filter((row) => {
      if (typeFilter !== 'ALL' && row.contactType !== typeFilter) return false
      if (!q) return true
      const name = `${row.firstName} ${row.middleName ?? ''} ${row.lastName ?? ''}`
      return `${name} ${row.email ?? ''} ${row.department ?? ''} ${row.designation ?? ''}`
        .toLowerCase()
        .includes(q)
    })
  }, [contacts, query, typeFilter])

  function openCreate() {
    setEditingId(null)
    setDraft(emptyContactDraft({ isPrimary: contacts.length === 0 }))
    setErrors({})
    setOpen(true)
  }

  async function openEdit(id: string) {
    try {
      const row = await tenantContactService.get(tenantId, id)
      setEditingId(id)
      setDraft(contactDraftFrom(row))
      setErrors({})
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function save() {
    const nextErrors = contactFieldErrors(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
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
    <section className="space-y-4 pb-8">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">Contacts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          People who represent this institution. Add or edit contacts from the drawer.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-border bg-background pl-8"
            placeholder="Search contacts by name, email, department..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <SearchableSelect
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as 'ALL' | ContactType)}
          className="w-full sm:w-40"
          options={[
            { value: 'ALL', label: 'All types' },
            ...Object.values(ContactType).map((type) => ({ value: type, label: labelize(type) })),
          ]}
          placeholder="Type"
        />
        <Button className="shrink-0 sm:ml-auto" onClick={openCreate}>
          <Plus className="size-4" />
          Add contact
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const name = `${row.firstName} ${row.middleName ?? ''} ${row.lastName ?? ''}`
                .replace(/\s+/g, ' ')
                .trim()
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{row.designation ?? '—'}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={row.contactType} />
                  </TableCell>
                  <TableCell>{row.email ?? '—'}</TableCell>
                  <TableCell>{row.mobilePhone ?? row.landlinePhone ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => void openEdit(row.id)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {!filtered.length ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No contacts yet. Click &quot;Add contact&quot; to add one.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>{editingId ? 'Edit contact' : 'Add contact'}</SheetTitle>
            <SheetDescription>
              Required: contact type, first name, and email.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <ContactFields
              value={draft}
              errors={errors}
              onChange={(next) => {
                setDraft(next)
                if (Object.keys(errors).length) setErrors(contactFieldErrors(next))
              }}
            />
          </div>
          <SheetFooter className="border-t border-border">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void save()}>
              {editingId ? 'Save changes' : 'Add contact'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Remove this contact?"
        description="This contact will be removed from the institution."
        confirmLabel="Remove"
        pending={deleting}
        onOpenChange={(next) => {
          if (!next) setDeleteId(null)
        }}
        onConfirm={async () => {
          if (!deleteId) return
          setDeleting(true)
          try {
            await tenantContactService.delete(tenantId, deleteId)
            toast.success('Contact removed')
            setDeleteId(null)
            await onReload()
          } catch (error) {
            toast.error(errorMessage(error))
          } finally {
            setDeleting(false)
          }
        }}
      />
    </section>
  )
}
