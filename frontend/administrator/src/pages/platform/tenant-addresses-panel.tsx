import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AddressFields } from '@/components/address-fields'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/filters'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { StatusBadge } from '@/components/status-badge'
import { addressDraftFrom, addressFieldErrors, addressPayload, emptyAddressDraft, type AddressDraft } from '@/lib/address'
import { errorMessage } from '@/lib/auth'
import { labelize } from '@/lib/utils'
import { AddressType, type TenantAddress } from '@/lib/types'
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
  const [errors, setErrors] = useState<Partial<Record<keyof AddressDraft, string>>>({})
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | AddressType>('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return addresses.filter((row) => {
      if (typeFilter !== 'ALL' && row.addressType !== typeFilter) return false
      if (!q) return true
      return `${row.addressLine1} ${row.city} ${row.provinceCode ?? ''} ${row.countryCode}`
        .toLowerCase()
        .includes(q)
    })
  }, [addresses, query, typeFilter])

  function openCreate() {
    setEditingId(null)
    setDraft({ ...emptyAddressDraft(), isPrimary: addresses.length === 0 })
    setErrors({})
    setOpen(true)
  }

  async function openEdit(id: string) {
    try {
      const row = await tenantAddressService.get(tenantId, id)
      setEditingId(id)
      setDraft(addressDraftFrom(row))
      setErrors({})
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function save() {
    const nextErrors = addressFieldErrors(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
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
    <section className="space-y-4 py-8">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">Addresses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Physical locations for this institution. Add or edit addresses from the drawer.
        </p>
      </div>

      <FilterBar
        canClear={Boolean(query) || typeFilter !== 'ALL'}
        onClear={() => {
          setQuery('')
          setTypeFilter('ALL')
        }}
        trailing={
          <Button className="shrink-0" onClick={openCreate}>
            <Plus className="size-4" />
            Add address
          </Button>
        }
      >
        <FilterSearch value={query} onChange={setQuery} placeholder="Search addresses by city, line, or province..." />
        <FilterSelect
          label="Type"
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as 'ALL' | AddressType)}
          options={[
            { value: 'ALL', label: 'All' },
            ...Object.values(AddressType).map((type) => ({ value: type, label: labelize(type) })),
          ]}
        />
      </FilterBar>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Primary</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium">{row.addressLine1}</p>
                  <p className="text-xs text-muted-foreground">{row.addressLine2 ?? row.area ?? '—'}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge value={row.addressType} />
                </TableCell>
                <TableCell>{row.city}</TableCell>
                <TableCell>{row.countryCode}</TableCell>
                <TableCell>{row.isPrimary ? 'Yes' : 'No'}</TableCell>
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
            ))}
            {!filtered.length ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No addresses yet. Click &quot;Add address&quot; to add one.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>{editingId ? 'Edit address' : 'Add address'}</SheetTitle>
            <SheetDescription>
              Required: address type, address line 1, and city. Country defaults to PK.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <AddressFields
              value={draft}
              errors={errors}
              onChange={(next) => {
                setDraft(next)
                if (Object.keys(errors).length) setErrors(addressFieldErrors(next))
              }}
            />
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void save()}>
              {editingId ? 'Save changes' : 'Add address'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Remove this address?"
        description="This address will be removed from the institution."
        confirmLabel="Remove"
        pending={deleting}
        onOpenChange={(next) => {
          if (!next) setDeleteId(null)
        }}
        onConfirm={async () => {
          if (!deleteId) return
          setDeleting(true)
          try {
            await tenantAddressService.delete(tenantId, deleteId)
            toast.success('Address removed')
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
