import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { AddressFields } from '@/components/address-fields'
import { ContactFields } from '@/components/contact-fields'
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
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { TenantFields } from '@/components/tenant-fields'
import {
  addressFieldErrors,
  addressPayload,
  emptyAddressDraft,
  type AddressDraft,
} from '@/lib/address'
import { errorMessage } from '@/lib/auth'
import {
  contactFieldErrors,
  contactPayload,
  emptyContactDraft,
  type ContactDraft,
} from '@/lib/contact'
import {
  createTenantPayload,
  emptyTenantDraft,
  tenantFieldErrors,
  type TenantDraft,
} from '@/lib/tenant'
import { ContactType, type AddressType } from '@/lib/types'
import { cn, labelize } from '@/lib/utils'
import { tenantAddressService, tenantContactService, tenantService } from '@/services/platform'

const STEPS = [
  {
    id: 'info',
    title: 'Tenant information',
    description: 'Basic details about the institution',
  },
  {
    id: 'contacts',
    title: 'Primary contacts',
    description: 'Add administrative contacts (optional)',
  },
  {
    id: 'addresses',
    title: 'Addresses',
    description: 'Add institution locations (optional)',
  },
  {
    id: 'review',
    title: 'Review & create',
    description: 'Verify details and create tenant',
  },
] as const

type LocalContact = ContactDraft & { localId: string }
type LocalAddress = AddressDraft & { localId: string }

function newId() {
  return crypto.randomUUID()
}

function contactName(row: ContactDraft) {
  return `${row.firstName} ${row.middleName} ${row.lastName}`.replace(/\s+/g, ' ').trim()
}

export function CreateTenantPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [tenant, setTenant] = useState<TenantDraft>(emptyTenantDraft())
  const [tenantErrors, setTenantErrors] = useState<Partial<Record<keyof TenantDraft, string>>>({})
  const [contacts, setContacts] = useState<LocalContact[]>([])
  const [addresses, setAddresses] = useState<LocalAddress[]>([])
  const [busy, setBusy] = useState(false)

  const [contactOpen, setContactOpen] = useState(false)
  const [contactEditingId, setContactEditingId] = useState<string | null>(null)
  const [contactDraft, setContactDraft] = useState(emptyContactDraft({ isPrimary: true }))
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactDraft, string>>>({})
  const [contactQuery, setContactQuery] = useState('')
  const [contactTypeFilter, setContactTypeFilter] = useState<'ALL' | ContactType>('ALL')

  const [addressOpen, setAddressOpen] = useState(false)
  const [addressEditingId, setAddressEditingId] = useState<string | null>(null)
  const [addressDraft, setAddressDraft] = useState(emptyAddressDraft())
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressDraft, string>>>({})
  const [addressQuery, setAddressQuery] = useState('')
  const [addressTypeFilter, setAddressTypeFilter] = useState<'ALL' | AddressType>('ALL')

  const current = STEPS[step]

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase()
    return contacts.filter((row) => {
      if (contactTypeFilter !== 'ALL' && row.contactType !== contactTypeFilter) return false
      if (!q) return true
      return `${contactName(row)} ${row.email} ${row.department} ${row.designation}`
        .toLowerCase()
        .includes(q)
    })
  }, [contacts, contactQuery, contactTypeFilter])

  const filteredAddresses = useMemo(() => {
    const q = addressQuery.trim().toLowerCase()
    return addresses.filter((row) => {
      if (addressTypeFilter !== 'ALL' && row.addressType !== addressTypeFilter) return false
      if (!q) return true
      return `${row.addressLine1} ${row.city} ${row.provinceCode} ${row.countryCode}`
        .toLowerCase()
        .includes(q)
    })
  }, [addresses, addressQuery, addressTypeFilter])

  function goNext() {
    if (step === 0) {
      const errors = tenantFieldErrors(tenant, 'create')
      setTenantErrors(errors)
      if (Object.keys(errors).length) return
    }
    setStep((value) => Math.min(value + 1, STEPS.length - 1))
  }

  function goPrev() {
    setStep((value) => Math.max(value - 1, 0))
  }

  function openContactCreate() {
    setContactEditingId(null)
    setContactDraft(emptyContactDraft({ isPrimary: contacts.length === 0 }))
    setContactErrors({})
    setContactOpen(true)
  }

  function openContactEdit(row: LocalContact) {
    const { localId, ...draft } = row
    setContactEditingId(localId)
    setContactDraft(draft)
    setContactErrors({})
    setContactOpen(true)
  }

  function saveContact() {
    const errors = contactFieldErrors(contactDraft)
    setContactErrors(errors)
    if (Object.keys(errors).length) return
    if (contactEditingId) {
      setContacts((rows) =>
        rows.map((row) => (row.localId === contactEditingId ? { ...contactDraft, localId: row.localId } : row)),
      )
    } else {
      setContacts((rows) => [...rows, { ...contactDraft, localId: newId() }])
    }
    setContactOpen(false)
  }

  function openAddressCreate() {
    setAddressEditingId(null)
    setAddressDraft({ ...emptyAddressDraft(), isPrimary: addresses.length === 0 })
    setAddressErrors({})
    setAddressOpen(true)
  }

  function openAddressEdit(row: LocalAddress) {
    const { localId, ...draft } = row
    setAddressEditingId(localId)
    setAddressDraft(draft)
    setAddressErrors({})
    setAddressOpen(true)
  }

  function saveAddress() {
    const errors = addressFieldErrors(addressDraft)
    setAddressErrors(errors)
    if (Object.keys(errors).length) return
    if (addressEditingId) {
      setAddresses((rows) =>
        rows.map((row) => (row.localId === addressEditingId ? { ...addressDraft, localId: row.localId } : row)),
      )
    } else {
      setAddresses((rows) => [...rows, { ...addressDraft, localId: newId() }])
    }
    setAddressOpen(false)
  }

  async function createAll() {
    const errors = tenantFieldErrors(tenant, 'create')
    setTenantErrors(errors)
    if (Object.keys(errors).length) {
      setStep(0)
      return
    }

    setBusy(true)
    try {
      const created = await tenantService.create(createTenantPayload(tenant))
      let contactFails = 0
      let addressFails = 0

      for (const row of contacts) {
        try {
          await tenantContactService.create(created.id, contactPayload(row))
        } catch {
          contactFails += 1
        }
      }
      for (const row of addresses) {
        try {
          await tenantAddressService.create(created.id, addressPayload(row))
        } catch {
          addressFails += 1
        }
      }

      if (contactFails || addressFails) {
        toast.warning(
          `${created.displayName} was created, but ${contactFails + addressFails} related record(s) failed.`,
        )
      } else {
        toast.success(`${created.displayName} was created`)
      }
      navigate(`/platform/tenants/${created.id}`)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="Tenants"
        title="Add tenant"
        description="Create a new institution on the platform. After creation, you can assign application subscriptions and invite a tenant administrator."
        actions={
          <Button variant="outline" asChild>
            <Link to="/platform/tenants">
              <ArrowLeft className="size-4" />
              Back to tenants
            </Link>
          </Button>
        }
      />

      <div className="portal-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <ol className="grid gap-3 sm:grid-cols-4">
            {STEPS.map((item, index) => {
              const done = index < step
              const active = index === step
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      done && 'bg-emerald-500 text-white',
                      active && 'bg-primary text-primary-foreground',
                      !done && !active && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        active || done ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {current.id === 'info' ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Institution information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Legal name, display name, and institution type are required. New tenants start in onboarding.
                </p>
              </div>
              <TenantFields
                mode="create"
                value={tenant}
                errors={tenantErrors}
                onChange={(next) => {
                  setTenant(next)
                  if (Object.keys(tenantErrors).length) setTenantErrors(tenantFieldErrors(next, 'create'))
                }}
              />
            </section>
          ) : null}

          {current.id === 'contacts' ? (
            <WizardListStep
              icon={Users}
              title="Primary contacts"
              description="Add administrative, technical, or billing representatives for this institution."
              query={contactQuery}
              onQuery={setContactQuery}
              queryPlaceholder="Search contacts by name, email, department..."
              filterValue={contactTypeFilter}
              onFilterChange={(value) => setContactTypeFilter(value as 'ALL' | ContactType)}
              filterOptions={[
                { value: 'ALL', label: 'All types' },
                ...Object.values(ContactType).map((type) => ({ value: type, label: labelize(type) })),
              ]}
              addLabel="Add contact"
              onAdd={openContactCreate}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((row, index) => (
                    <TableRow key={row.localId}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium">{contactName(row) || '—'}</p>
                        <p className="text-xs text-muted-foreground">{row.designation || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={row.contactType} />
                      </TableCell>
                      <TableCell>{row.department || '—'}</TableCell>
                      <TableCell>{row.email || '—'}</TableCell>
                      <TableCell>{row.mobilePhone || row.landlinePhone || '—'}</TableCell>
                      <TableCell>
                        <StatusBadge value={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openContactEdit(row)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setContacts((rows) => rows.filter((item) => item.localId !== row.localId))}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredContacts.length ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        No contacts added yet. Click &quot;Add contact&quot; to add one for this institution.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </WizardListStep>
          ) : null}

          {current.id === 'addresses' ? (
            <WizardListStep
              icon={MapPin}
              title="Addresses"
              description="Add head office, campus, or mailing locations for this institution."
              query={addressQuery}
              onQuery={setAddressQuery}
              queryPlaceholder="Search addresses by city, line, or province..."
              filterValue={addressTypeFilter}
              onFilterChange={(value) => setAddressTypeFilter(value as 'ALL' | AddressType)}
              filterOptions={[
                { value: 'ALL', label: 'All types' },
                { value: 'HEAD_OFFICE', label: 'Head office' },
                { value: 'CAMPUS', label: 'Campus' },
                { value: 'BRANCH', label: 'Branch' },
                { value: 'MAILING', label: 'Mailing' },
                { value: 'BILLING', label: 'Billing' },
              ]}
              addLabel="Add address"
              onAdd={openAddressCreate}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAddresses.map((row, index) => (
                    <TableRow key={row.localId}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium">{row.addressLine1 || '—'}</p>
                        <p className="text-xs text-muted-foreground">{row.addressLine2 || row.area || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={row.addressType} />
                      </TableCell>
                      <TableCell>{row.city || '—'}</TableCell>
                      <TableCell>{row.provinceCode || '—'}</TableCell>
                      <TableCell>{row.countryCode || '—'}</TableCell>
                      <TableCell>{row.isPrimary ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openAddressEdit(row)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setAddresses((rows) => rows.filter((item) => item.localId !== row.localId))}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredAddresses.length ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        No addresses added yet. Click &quot;Add address&quot; to add one for this institution.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </WizardListStep>
          ) : null}

          {current.id === 'review' ? (
            <section className="space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Review & create</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm the institution details, then create the tenant with its contacts and addresses.
                </p>
              </div>
              <div className="grid max-w-3xl gap-4">
                <ReviewCard title="Tenant information">
                  <ReviewRow label="Legal name" value={tenant.legalName} />
                  <ReviewRow label="Display name" value={tenant.displayName} />
                  <ReviewRow label="Type" value={labelize(tenant.institutionType)} />
                  <ReviewRow label="Deployment" value={labelize(tenant.deploymentModel)} />
                  <ReviewRow label="Country" value={tenant.countryCode || '—'} />
                  <ReviewRow label="City" value={tenant.city || '—'} />
                  <ReviewRow label="Website" value={tenant.websiteUrl || '—'} />
                </ReviewCard>
                <ReviewCard title={`Contacts (${contacts.length})`}>
                  {contacts.length ? (
                    contacts.map((row) => (
                      <div key={row.localId} className="border-b border-border py-2 last:border-0">
                        <p className="font-medium">{contactName(row)}</p>
                        <p className="text-xs text-muted-foreground">
                          {labelize(row.contactType)} · {row.email || 'No email'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No contacts added.</p>
                  )}
                </ReviewCard>
                <ReviewCard title={`Addresses (${addresses.length})`}>
                  {addresses.length ? (
                    addresses.map((row) => (
                      <div key={row.localId} className="border-b border-border py-2 last:border-0">
                        <p className="font-medium">{row.addressLine1}</p>
                        <p className="text-xs text-muted-foreground">
                          {labelize(row.addressType)} · {row.city}, {row.countryCode}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No addresses added.</p>
                  )}
                </ReviewCard>
              </div>
            </section>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <Button variant="outline" asChild>
            <Link to="/platform/tenants">Cancel</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={goPrev} loading={busy}>
                <ArrowLeft className="size-4" />
                Previous
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext}>
                Next: {STEPS[step + 1].title}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button loading={busy} onClick={() => void createAll()}>Create tenant</Button>
            )}
          </div>
        </div>
      </div>

      <Sheet open={contactOpen} onOpenChange={setContactOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>{contactEditingId ? 'Edit contact' : 'Add contact'}</SheetTitle>
            <SheetDescription>
              Required: contact type, first name, and email. You can add more contacts after the tenant is created.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <ContactFields
              value={contactDraft}
              errors={contactErrors}
              onChange={(next) => {
                setContactDraft(next)
                if (Object.keys(contactErrors).length) setContactErrors(contactFieldErrors(next))
              }}
            />
          </div>
          <SheetFooter className="border-t border-border">
            <Button variant="outline" onClick={() => setContactOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveContact}>{contactEditingId ? 'Save changes' : 'Add contact'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={addressOpen} onOpenChange={setAddressOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>{addressEditingId ? 'Edit address' : 'Add address'}</SheetTitle>
            <SheetDescription>
              Required: address type, address line 1, and city. Country defaults to PK.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <AddressFields
              value={addressDraft}
              errors={addressErrors}
              onChange={(next) => {
                setAddressDraft(next)
                if (Object.keys(addressErrors).length) setAddressErrors(addressFieldErrors(next))
              }}
            />
          </div>
          <SheetFooter className="border-t border-border">
            <Button variant="outline" onClick={() => setAddressOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAddress}>{addressEditingId ? 'Save changes' : 'Add address'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function WizardListStep({
  icon: Icon,
  title,
  description,
  query,
  onQuery,
  queryPlaceholder,
  filterValue,
  onFilterChange,
  filterOptions,
  addLabel,
  onAdd,
  children,
}: {
  icon: typeof Users
  title: string
  description: string
  query: string
  onQuery: (value: string) => void
  queryPlaceholder: string
  filterValue: string
  onFilterChange: (value: string) => void
  filterOptions: Array<{ value: string; label: string }>
  addLabel: string
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-border bg-background pl-8"
            placeholder={queryPlaceholder}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
        </div>
        <SearchableSelect
          value={filterValue}
          onValueChange={onFilterChange}
          className="w-full sm:w-40"
          options={filterOptions}
          placeholder="Type"
        />
        <Button className="shrink-0 sm:ml-auto" onClick={onAdd}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">{children}</div>
    </section>
  )
}

function ReviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <div className="mt-3 space-y-1">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
