import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Globe2, Mail, MapPin, PackageCheck, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { TenantFields } from '@/components/tenant-fields'
import { SectionTitle } from '@/components/section-title'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { emptyTenantDraft, lifecycleFor, tenantDraftFrom, updateTenantPayload, validateTenantDraft } from '@/lib/tenant'
import { cn } from '@/lib/utils'
import {
  type AdminInvitation,
  type AvailableApplication,
  type CatalogApplication,
  type Entitlement,
  type Subscription,
  type Tenant,
  type TenantAddress,
  type TenantAsset,
  type TenantConfiguration,
  type TenantContact,
  type TenantIdentifier,
  type TenantSmtp,
} from '@/lib/types'
import {
  applicationService,
  entitlementService,
  invitationService,
  subscriptionService,
  tenantAddressService,
  tenantAssetService,
  tenantConfigurationService,
  tenantContactService,
  tenantIdentifierService,
  tenantService,
  tenantSmtpService,
} from '@/services/platform'
import { TenantContactsPanel } from '@/pages/platform/tenant-contacts-panel'
import { TenantAddressesPanel } from '@/pages/platform/tenant-addresses-panel'
import { TenantIdentifiersPanel } from '@/pages/platform/tenant-identifiers-panel'
import { TenantConfigurationPanel } from '@/pages/platform/tenant-configuration-panel'
import { TenantSmtpPanel } from '@/pages/platform/tenant-smtp-panel'
import { TenantAssetsPanel } from '@/pages/platform/tenant-assets-panel'
import { TenantInvitationsPanel } from '@/pages/platform/tenant-invitations-panel'
import { TenantSubscriptionsPanel } from '@/pages/platform/tenant-subscriptions-panel'
import { TenantEntitlementsPanel } from '@/pages/platform/tenant-entitlements-panel'

const tabs = [
  ['overview', 'Overview'],
  ['institution', 'Institution'],
  ['settings', 'Settings'],
  ['subscriptions', 'Subscriptions'],
  ['entitlements', 'Entitlements'],
  ['invitations', 'Invitations'],
] as const

type Tab = (typeof tabs)[number][0]

export function TenantDetailPage() {
  const { tenantId = '' } = useParams()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [contacts, setContacts] = useState<TenantContact[]>([])
  const [addresses, setAddresses] = useState<TenantAddress[]>([])
  const [identifiers, setIdentifiers] = useState<TenantIdentifier[]>([])
  const [configuration, setConfiguration] = useState<TenantConfiguration | null>(null)
  const [smtp, setSmtp] = useState<TenantSmtp | null>(null)
  const [assets, setAssets] = useState<TenantAsset[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [available, setAvailable] = useState<AvailableApplication[]>([])
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [applications, setApplications] = useState<CatalogApplication[]>([])
  const [missing, setMissing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [identity, setIdentity] = useState(emptyTenantDraft())
  const [savingIdentity, setSavingIdentity] = useState(false)

  const reload = useCallback(async () => {
    const nextTenant = await tenantService.get(tenantId)
    setTenant(nextTenant)
    setIdentity(tenantDraftFrom(nextTenant))

    const [apps, contactPage, addressPage, identifierPage, assetPage, subPage, entPage, invites, availability] =
      await Promise.allSettled([
        applicationService.list(1, 100),
        tenantContactService.list(tenantId),
        tenantAddressService.list(tenantId),
        tenantIdentifierService.list(tenantId),
        tenantAssetService.list(tenantId),
        subscriptionService.list(tenantId),
        entitlementService.list(tenantId),
        invitationService.list(tenantId),
        tenantService.availableApplications(tenantId),
      ])
    if (apps.status === 'fulfilled') setApplications(apps.value.data)
    if (contactPage.status === 'fulfilled') setContacts(contactPage.value.data)
    if (addressPage.status === 'fulfilled') setAddresses(addressPage.value.data)
    if (identifierPage.status === 'fulfilled') setIdentifiers(identifierPage.value.data)
    if (assetPage.status === 'fulfilled') setAssets(assetPage.value.data)
    if (subPage.status === 'fulfilled') setSubscriptions(subPage.value.data)
    if (entPage.status === 'fulfilled') setEntitlements(entPage.value.data)
    if (invites.status === 'fulfilled') setInvitations(invites.value.data)
    if (availability.status === 'fulfilled') setAvailable(availability.value.applications)
    const missingOk = (error: unknown) => error instanceof ApiError && error.status === 404
    try {
      setConfiguration(await tenantConfigurationService.get(tenantId))
    } catch (error) {
      if (!missingOk(error)) throw error
      setConfiguration(null)
    }
    try {
      setSmtp(await tenantSmtpService.get(tenantId))
    } catch (error) {
      if (!missingOk(error)) throw error
      setSmtp(null)
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
            {lifecycleFor(tenant.status).canActivate ? (
              <Button variant="outline" onClick={() => void run(() => tenantService.activate(tenant.id), 'Tenant activated')}>
                Activate
              </Button>
            ) : null}
            {lifecycleFor(tenant.status).canSuspend ? (
              <Button variant="outline" onClick={() => void run(() => tenantService.suspend(tenant.id), 'Tenant suspended')}>
                Suspend
              </Button>
            ) : null}
            {lifecycleFor(tenant.status).canRetire ? (
              <Button variant="destructive" onClick={() => void run(() => tenantService.retire(tenant.id), 'Tenant retired')}>
                Retire
              </Button>
            ) : null}
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
            <div className="space-y-5">
              <OverviewSection
                eyebrow="At a glance"
                title="Tenant summary"
                description="A quick view of the institution setup and access."
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat icon={UsersRound} label="Contacts" value={contacts.length} />
                  <Stat icon={MapPin} label="Addresses" value={addresses.length} />
                  <Stat icon={Mail} label="Invitations" value={invitations.length} />
                  <Stat icon={PackageCheck} label="Subscriptions" value={subscriptions.length} />
                </div>
              </OverviewSection>

              <OverviewSection
                eyebrow="Institution"
                title="Institution details"
                description="Update the institution's public identity and location."
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
                  <div className="space-y-4">
                    <TenantFields mode="update" value={identity} onChange={setIdentity} />
                    <div className="flex justify-end">
                      <Button
                        disabled={savingIdentity}
                        onClick={() => {
                          const identityError = validateTenantDraft(identity, 'update')
                          if (identityError) {
                            toast.error(identityError)
                            return
                          }
                          setSavingIdentity(true)
                          void run(
                            () => tenantService.update(tenant.id, updateTenantPayload(identity)),
                            'Tenant updated',
                          ).finally(() => setSavingIdentity(false))
                        }}
                      >
                        {savingIdentity ? 'Saving…' : 'Save changes'}
                      </Button>
                    </div>
                  </div>
                  <dl className="grid content-start gap-0 rounded-2xl border border-border bg-muted/25 px-4">
                    <DetailRow label="Tenant code" value={tenant.tenantCode} />
                    <DetailRow label="Institution type" value={tenant.institutionType.replaceAll('_', ' ')} />
                    <DetailRow label="Deployment" value={tenant.deploymentModel.replaceAll('_', ' ')} />
                    <DetailRow label="Country" value={tenant.countryCode} />
                    <DetailRow label="Activated" value={formatDate(tenant.activatedAt)} />
                  </dl>
                </div>
              </OverviewSection>

              <div className="grid gap-5 xl:grid-cols-2">
                <OverviewSection
                  eyebrow="People"
                  title="Key contacts"
                  description="Contact records linked to this institution."
                  action={
                    <Button size="sm" variant="outline" onClick={() => setTab('institution')}>
                      Manage contacts
                    </Button>
                  }
                >
                  {contacts.length ? (
                    <div className="divide-y divide-border">
                      {contacts.slice(0, 4).map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {[contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ')}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {contact.email || contact.mobilePhone || contact.contactType.replaceAll('_', ' ')}
                            </p>
                          </div>
                          {contact.isPrimary ? <StatusBadge value="ACTIVE" /> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyNote text="No contacts have been added yet." />
                  )}
                </OverviewSection>

                <OverviewSection
                  eyebrow="Access"
                  title="Available applications"
                  description="Applications currently available to this tenant."
                  action={
                    <Button size="sm" variant="outline" onClick={() => setTab('subscriptions')}>
                      Manage access
                    </Button>
                  }
                >
                  {available.length ? (
                    <div className="divide-y divide-border">
                      {available.slice(0, 4).map((app) => (
                        <div key={app.entitlementId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{app.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{app.applicationCode}</p>
                          </div>
                          <StatusBadge value="ACTIVE" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyNote text="No applications are available yet." />
                  )}
                </OverviewSection>
              </div>
            </div>
          ) : null}

          {tab === 'institution' ? (
            <div className="divide-y divide-border">
              <TenantContactsPanel tenantId={tenant.id} contacts={contacts} onReload={reload} />
              <TenantAddressesPanel tenantId={tenant.id} addresses={addresses} onReload={reload} />
              <TenantIdentifiersPanel tenantId={tenant.id} identifiers={identifiers} onReload={reload} />
            </div>
          ) : null}

          {tab === 'settings' ? (
            <div className="divide-y divide-border">
              <TenantConfigurationPanel
                key={configuration?.updatedAt ?? 'config-new'}
                tenantId={tenant.id}
                configuration={configuration}
                assets={assets}
                onReload={reload}
              />
              <TenantSmtpPanel
                key={smtp?.updatedAt ?? 'smtp-new'}
                tenantId={tenant.id}
                smtp={smtp}
                onReload={reload}
              />
              <TenantAssetsPanel tenantId={tenant.id} assets={assets} onReload={reload} />
            </div>
          ) : null}

          {tab === 'subscriptions' ? (
            <TenantSubscriptionsPanel
              tenantId={tenant.id}
              subscriptions={subscriptions}
              applications={applications}
              onReload={reload}
            />
          ) : null}

          {tab === 'entitlements' ? (
            <TenantEntitlementsPanel
              tenantId={tenant.id}
              applications={applications}
              entitlements={entitlements}
              subscriptions={subscriptions}
              onReload={reload}
            />
          ) : null}

          {tab === 'invitations' ? (
            <TenantInvitationsPanel
              tenantId={tenant.id}
              invitations={invitations}
              onReload={reload}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

type OverviewIcon = typeof Building2

function OverviewSection({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#0a9489] uppercase">{eyebrow}</p>
          <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Stat({ icon: Icon, label, value }: { icon: OverviewIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/25 px-4 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#00c2b2]/12 text-[#087d75]">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-display text-2xl leading-none font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
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

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}
