import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Field, FieldGrid } from '@/components/field'
import { SubscriptionFields } from '@/components/subscription-fields'
import { emptySubscriptionDraft } from '@/lib/subscription'
import { ContactFields } from '@/components/contact-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { contactPayload, emptyContactDraft, validateContact } from '@/lib/contact'
import { cn } from '@/lib/utils'
import {
  AddressType,
  ApplicationStatus,
  EntitlementStatus,
  IdentifierType,
  SubscriptionStatus,
  type AdminInvitation,
  type AvailableApplication,
  type CatalogApplication,
  type Entitlement,
  type InstitutionProfile,
  type Subscription,
  type Tenant,
  type TenantAddress,
  type TenantContact,
  type TenantIdentifier,
} from '@/lib/types'
import {
  applicationService,
  entitlementService,
  invitationService,
  subscriptionService,
  tenantAddressService,
  tenantContactService,
  tenantIdentifierService,
  tenantProfileService,
  tenantService,
} from '@/services/platform'

const tabs = [
  ['overview', 'Overview'],
  ['institution', 'Institution'],
  ['subscriptions', 'Subscriptions'],
  ['entitlements', 'Entitlements'],
  ['invitations', 'Invitations'],
] as const

type Tab = (typeof tabs)[number][0]

export function TenantDetailPage() {
  const { tenantId = '' } = useParams()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [profile, setProfile] = useState<InstitutionProfile | null>(null)
  const [contacts, setContacts] = useState<TenantContact[]>([])
  const [addresses, setAddresses] = useState<TenantAddress[]>([])
  const [identifiers, setIdentifiers] = useState<TenantIdentifier[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [available, setAvailable] = useState<AvailableApplication[]>([])
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [missing, setMissing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [subOpen, setSubOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const [identifierOpen, setIdentifierOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [draft, setDraft] = useState(emptySubscriptionDraft())
  const [contact, setContact] = useState(emptyContactDraft())
  const [address, setAddress] = useState({
    addressLine1: '',
    city: '',
    countryCode: 'PK',
    addressType: AddressType.HEAD_OFFICE as AddressType,
  })
  const [identifier, setIdentifier] = useState({
    identifierValue: '',
    issuingAuthority: '',
    identifierType: IdentifierType.REGISTRATION as IdentifierType,
  })

  const reload = useCallback(async () => {
    const [nextTenant, apps] = await Promise.all([tenantService.get(tenantId), applicationService.list(1, 100)])
    setTenant(nextTenant)
    setApplications(apps.data)
    const [contactPage, addressPage, identifierPage, subPage, entPage, invites, availability] = await Promise.all([
      tenantContactService.list(tenantId),
      tenantAddressService.list(tenantId),
      tenantIdentifierService.list(tenantId),
      subscriptionService.list(tenantId),
      entitlementService.list(tenantId),
      invitationService.list(tenantId),
      tenantService.availableApplications(tenantId).catch(() => ({ applications: [] as AvailableApplication[] })),
    ])
    setContacts(contactPage.data)
    setAddresses(addressPage.data)
    setIdentifiers(identifierPage.data)
    setSubscriptions(subPage.data)
    setEntitlements(entPage.data)
    setInvitations(invites.data)
    setAvailable(availability.applications)
    try {
      setProfile(await tenantProfileService.get(tenantId))
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      setProfile(null)
    }
  }, [tenantId])

  useEffect(() => {
    setLoading(true)
    reload()
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) setMissing(true)
        else toast.error(errorMessage(error))
      })
      .finally(() => setLoading(false))
  }, [reload])

  if (missing) {
    return <EmptyState title="Tenant not found" description="This institution is not in the current workspace." />
  }
  if (loading || !tenant) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      await reload()
      toast.success(success)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={tenant.tenantCode}
        title={tenant.displayName}
        description={tenant.legalName}
        badge={
          <>
            <span className="rounded-full bg-white/14 px-2.5 py-1 text-xs font-medium tracking-wide">
              {tenant.status.replaceAll('_', ' ')}
            </span>
            <span className="rounded-full bg-[#00c2b2]/20 px-2.5 py-1 text-xs font-medium tracking-wide text-[#7fe2de]">
              {tenant.deploymentModel.replaceAll('_', ' ')}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/platform/tenants">
                <ArrowLeft />
                Back to tenants
              </Link>
            </Button>
            <Button variant="outline" onClick={() => void run(() => tenantService.activate(tenant.id), 'Tenant activated')}>
              Activate
            </Button>
            <Button variant="outline" onClick={() => void run(() => tenantService.suspend(tenant.id), 'Tenant suspended')}>
              Suspend
            </Button>
            <Button variant="destructive" onClick={() => void run(() => tenantService.retire(tenant.id), 'Tenant retired')}>
              Retire
            </Button>
          </>
        }
      />

      <div className="portal-card overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'relative shrink-0 px-3 py-3.5 text-sm font-medium transition-colors',
                tab === value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              {tab === value ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#00c2b2]" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {tab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Contacts" value={contacts.length} />
                <Stat label="Subscriptions" value={subscriptions.length} />
                <Stat label="Entitlements" value={entitlements.filter((row) => row.status === EntitlementStatus.ACTIVE).length} />
                <Stat label="Invitations" value={invitations.length} />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <section>
                  <SectionTitle title="Available applications" description="Derived from active entitlements in period." />
                  {available.length ? (
                    <ul className="space-y-2">
                      {available.map((app) => (
                        <li
                          key={app.entitlementId}
                          className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">{app.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{app.applicationCode}</p>
                          </div>
                          <StatusBadge value="ACTIVE" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyNote text="No applications are currently available. Create a subscription or grant an entitlement." />
                  )}
                </section>
                <section>
                  <SectionTitle title="Institution identity" description="SMTP, branding, and assets are managed by the tenant administrator." />
                  <dl className="rounded-xl border border-border bg-background/70 px-4">
                    <DetailRow label="Legal name" value={tenant.legalName} />
                    <DetailRow label="Website" value={tenant.websiteUrl} />
                    <DetailRow label="Country" value={tenant.countryCode} />
                    <DetailRow label="City" value={tenant.city} />
                  </dl>
                </section>
              </div>
            </div>
          ) : null}

          {tab === 'institution' ? (
            <div className="divide-y divide-border">
              <section className="pb-8">
                <SectionTitle title="Profile" description="Legal and campus details for this institution." />
                <dl className="rounded-xl border border-border bg-background/70 px-4">
                  <DetailRow label="Display name" value={profile?.displayName ?? tenant.displayName} />
                  <DetailRow label="Registration" value={profile?.registrationNumber} />
                  <DetailRow label="Address" value={profile?.addressLine1} />
                  <DetailRow label="City" value={profile?.city ?? tenant.city} />
                  <DetailRow label="Website" value={profile?.website ?? tenant.websiteUrl} />
                </dl>
              </section>

              <section className="py-8">
                <SectionTitle
                  title="Contacts"
                  description="People who represent this institution."
                  action={
                    <Dialog
                      open={contactOpen}
                      onOpenChange={(open) => {
                        setContactOpen(open)
                        if (open) setContact(emptyContactDraft())
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button>Add contact</Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Add contact</DialogTitle>
                          <DialogDescription>
                            POST /tenant/:id/contact — first name and contact type are required. Primary is a checkbox.
                          </DialogDescription>
                        </DialogHeader>
                        <ContactFields value={contact} onChange={setContact} />
                        <DialogFooter>
                          <Button
                            disabled={!contact.firstName.trim()}
                            onClick={() => {
                              const contactError = validateContact(contact)
                              if (contactError) {
                                toast.error(contactError)
                                return
                              }
                              void run(async () => {
                                await tenantContactService.create(tenant.id, contactPayload(contact))
                                setContactOpen(false)
                                setContact(emptyContactDraft())
                              }, 'Contact added')
                            }}
                          >
                            Save contact
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  }
                />
                <DataTable
                  columns={['Name', 'Email', 'Type', 'Primary', '']}
                  empty="No contacts yet."
                  rows={contacts.map((row) => [
                    `${row.firstName} ${row.middleName ?? ''} ${row.lastName ?? ''}`.replace(/\s+/g, ' ').trim(),
                    row.email ?? '—',
                    labelize(row.contactType),
                    row.isPrimary ? 'Yes' : 'No',
                    <Button
                      key={row.id}
                      size="sm"
                      variant="outline"
                      onClick={() => void run(() => tenantContactService.delete(tenant.id, row.id), 'Contact removed')}
                    >
                      Remove
                    </Button>,
                  ])}
                />
              </section>

              <section className="py-8">
                <SectionTitle
                  title="Addresses"
                  description="Head office and campus locations."
                  action={
                    <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
                      <DialogTrigger asChild>
                        <Button>Add address</Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add address</DialogTitle>
                      </DialogHeader>
                      <FieldGrid>
                        <Field label="Line 1">
                          <Input
                            value={address.addressLine1}
                            onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                          />
                        </Field>
                        <Field label="City">
                          <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                        </Field>
                        <Field label="Type">
                          <Select
                            value={address.addressType}
                            onValueChange={(value) => setAddress({ ...address, addressType: value as AddressType })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(AddressType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {labelize(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </FieldGrid>
                      <DialogFooter>
                        <Button
                          disabled={!address.addressLine1 || !address.city}
                          onClick={() =>
                            void run(async () => {
                              await tenantAddressService.create(tenant.id, {
                                addressType: address.addressType,
                                addressLine1: address.addressLine1,
                                city: address.city,
                                countryCode: address.countryCode,
                                isPrimary: addresses.length === 0,
                              })
                              setAddressOpen(false)
                              setAddress({
                                addressLine1: '',
                                city: '',
                                countryCode: 'PK',
                                addressType: AddressType.HEAD_OFFICE,
                              })
                            }, 'Address added')
                          }
                        >
                          Save address
                        </Button>
                      </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  }
                />
                <DataTable
                  columns={['Address', 'City', 'Type']}
                  empty="No addresses yet."
                  rows={addresses.map((row) => [row.addressLine1, row.city, labelize(row.addressType)])}
                />
              </section>

              <section className="pt-8">
                <SectionTitle
                  title="Identifiers"
                  description="Registration, tax, and accreditation numbers."
                  action={
                    <Dialog open={identifierOpen} onOpenChange={setIdentifierOpen}>
                      <DialogTrigger asChild>
                        <Button>Add identifier</Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add identifier</DialogTitle>
                      </DialogHeader>
                      <FieldGrid>
                        <Field label="Value">
                          <Input
                            value={identifier.identifierValue}
                            onChange={(e) => setIdentifier({ ...identifier, identifierValue: e.target.value })}
                          />
                        </Field>
                        <Field label="Authority">
                          <Input
                            value={identifier.issuingAuthority}
                            onChange={(e) => setIdentifier({ ...identifier, issuingAuthority: e.target.value })}
                          />
                        </Field>
                        <Field label="Type">
                          <Select
                            value={identifier.identifierType}
                            onValueChange={(value) =>
                              setIdentifier({ ...identifier, identifierType: value as IdentifierType })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(IdentifierType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {labelize(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </FieldGrid>
                      <DialogFooter>
                        <Button
                          disabled={!identifier.identifierValue}
                          onClick={() =>
                            void run(async () => {
                              await tenantIdentifierService.create(tenant.id, {
                                identifierType: identifier.identifierType,
                                identifierValue: identifier.identifierValue,
                                issuingAuthority: identifier.issuingAuthority || undefined,
                              })
                              setIdentifierOpen(false)
                              setIdentifier({
                                identifierValue: '',
                                issuingAuthority: '',
                                identifierType: IdentifierType.REGISTRATION,
                              })
                            }, 'Identifier added')
                          }
                        >
                          Save identifier
                        </Button>
                      </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  }
                />
                <DataTable
                  columns={['Type', 'Value', 'Authority']}
                  empty="No identifiers yet."
                  rows={identifiers.map((row) => [
                    labelize(row.identifierType),
                    row.identifierValue,
                    row.issuingAuthority ?? '—',
                  ])}
                />
              </section>
            </div>
          ) : null}

          {tab === 'subscriptions' ? (
            <div>
              <SectionTitle
                title="Subscriptions"
                description="Create a period and assign applications. Inactive or ended periods stay inactive — create a new subscription to continue."
                action={
                  <Dialog open={subOpen} onOpenChange={setSubOpen}>
                    <DialogTrigger asChild>
                      <Button>New subscription</Button>
                    </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create subscription</DialogTitle>
                      <DialogDescription>Assigned applications are entitled for this period.</DialogDescription>
                    </DialogHeader>
                    <SubscriptionFields value={draft} onChange={setDraft} applications={applications} />
                    <DialogFooter>
                      <Button
                        onClick={() =>
                          void run(async () => {
                            await subscriptionService.create(tenant.id, draft)
                            setSubOpen(false)
                            setDraft(emptySubscriptionDraft())
                          }, 'Subscription created')
                        }
                      >
                        Save
                      </Button>
                    </DialogFooter>
                    </DialogContent>
                  </Dialog>
                }
              />
              <DataTable
                columns={['Code', 'Plan', 'Period', 'Applications', 'Status', '']}
                empty="No subscriptions yet."
                rows={subscriptions.map((row) => [
                  row.subscriptionCode,
                  `${labelize(row.planType)}${row.billingCycle ? ` · ${labelize(row.billingCycle)}` : ''}`,
                  `${row.startDate} → ${row.endDate}`,
                  row.applicationCodes.length ? row.applicationCodes.join(', ') : '—',
                  <StatusBadge key={row.id} value={row.status} />,
                  row.status === SubscriptionStatus.ACTIVE ? (
                    <Button
                      key={`${row.id}-off`}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void run(
                          () => subscriptionService.update(tenant.id, row.id, { status: SubscriptionStatus.INACTIVE }),
                          'Subscription set inactive',
                        )
                      }
                    >
                      Inactive
                    </Button>
                  ) : periodEnded(row.endDate) ? (
                    <span key={`${row.id}-ended`} className="text-xs text-muted-foreground">
                      Ended
                    </span>
                  ) : (
                    <Button
                      key={`${row.id}-on`}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void run(
                          () => subscriptionService.update(tenant.id, row.id, { status: SubscriptionStatus.ACTIVE }),
                          'Subscription activated',
                        )
                      }
                    >
                      Activate
                    </Button>
                  ),
                ])}
              />
            </div>
          ) : null}

          {tab === 'entitlements' ? (
            <div>
              <SectionTitle
                title="Application entitlements"
                description="Every catalogue application can be granted or set inactive for this tenant."
              />
              {applications.length ? (
                <ul className="space-y-2">
                  {applications.map((app) => {
                    const entitlement = entitlements.find(
                      (row) => row.applicationId === app.id || row.applicationCode === app.applicationCode,
                    )
                    const active = entitlement?.status === EntitlementStatus.ACTIVE
                    const catalogueActive = app.status === ApplicationStatus.ACTIVE
                    return (
                      <li
                        key={app.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/70 px-4 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{app.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{app.applicationCode}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge value={entitlement?.status ?? 'NOT_ENTITLED'} />
                          {active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void run(
                                  () =>
                                    entitlementService.update(tenant.id, entitlement.id, {
                                      status: EntitlementStatus.INACTIVE,
                                    }),
                                  `${app.name} set inactive`,
                                )
                              }
                            >
                              Inactive
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={!catalogueActive}
                              onClick={() =>
                                void run(
                                  () => entitlementService.create(tenant.id, { applicationCode: app.applicationCode }),
                                  `${app.name} entitled`,
                                )
                              }
                            >
                              Grant
                            </Button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyNote text="Register applications in the catalogue first." />
              )}
            </div>
          ) : null}

          {tab === 'invitations' ? (
            <div>
              <SectionTitle
                title="Administrator invitations"
                description="The invitation token is shown once so you can share it while email is not connected."
                action={
                  <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                      <Button>Send invite</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite tenant administrator</DialogTitle>
                      </DialogHeader>
                      <Field label="Email">
                        <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                      </Field>
                      <DialogFooter>
                        <Button
                          disabled={!inviteEmail}
                          onClick={() =>
                            void run(async () => {
                              const created = await invitationService.create(tenant.id, inviteEmail)
                              setInviteToken(created.invitationToken ?? '')
                              setInviteEmail('')
                              setInviteOpen(false)
                            }, 'Invitation created')
                          }
                        >
                          Send invite
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                }
              />
              {inviteToken ? (
                <p className="mb-4 rounded-xl border border-[#00c2b2]/30 bg-[#00c2b2]/8 p-3 font-mono text-xs break-all">
                  {inviteToken}
                </p>
              ) : null}
              <DataTable
                columns={['Email', 'Status', 'Expires', '']}
                empty="No invitations yet."
                rows={invitations.map((row) => [
                  row.email,
                  <StatusBadge key={row.id} value={row.status} />,
                  String(row.expiresAt).slice(0, 10),
                  row.status === 'PENDING' ? (
                    <div key={`${row.id}-inv`} className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void run(async () => {
                            const resent = await invitationService.resend(tenant.id, row.id)
                            setInviteToken(resent.invitationToken ?? '')
                          }, 'Invitation resent')
                        }
                      >
                        Resend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void run(() => invitationService.cancel(tenant.id, row.id), 'Invitation cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    ''
                  ),
                ])}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function labelize(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function periodEnded(endDate: string) {
  return Boolean(endDate) && endDate < new Date().toISOString().slice(0, 10)
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/70 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
      <p className="font-display mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[9.5rem_1fr] sm:items-baseline sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{value || '—'}</dd>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[]
  rows: Array<Array<ReactNode>>
  empty: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={`${column}-${index}`}>{column || null}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className={cellIndex === row.length - 1 ? 'text-right' : undefined}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {!rows.length ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}
