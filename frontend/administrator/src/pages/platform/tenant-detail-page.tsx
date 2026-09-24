import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, MapPin, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { TenantFields } from '@/components/tenant-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import {
  emptyTenantDraft,
  lifecycleFor,
  tenantDraftFrom,
  tenantFieldErrors,
  updateTenantPayload,
} from '@/lib/tenant'
import { cn } from '@/lib/utils'
import type { Tenant, TenantAddress, TenantContact } from '@/lib/types'
import {
  tenantAddressService,
  tenantContactService,
  tenantService,
} from '@/services/platform'
import { TenantContactsPanel } from '@/pages/platform/tenant-contacts-panel'
import { TenantAddressesPanel } from '@/pages/platform/tenant-addresses-panel'

const SECTIONS = [
  {
    id: 'info',
    title: 'Tenant information',
    description: 'Basic details about the institution',
    icon: Building2,
  },
  {
    id: 'contacts',
    title: 'Primary contacts',
    description: 'Manage administrative contacts',
    icon: Users,
  },
  {
    id: 'addresses',
    title: 'Addresses',
    description: 'Manage institution locations',
    icon: MapPin,
  },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function TenantDetailPage() {
  const { tenantId = '' } = useParams()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [contacts, setContacts] = useState<TenantContact[]>([])
  const [addresses, setAddresses] = useState<TenantAddress[]>([])
  const [missing, setMissing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<SectionId>('info')
  const [identity, setIdentity] = useState(emptyTenantDraft())
  const [identityErrors, setIdentityErrors] = useState<Partial<Record<keyof typeof identity, string>>>({})
  const [savingIdentity, setSavingIdentity] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    description: string
    confirmLabel: string
    success: string
    run: () => Promise<unknown>
  } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const reload = useCallback(async () => {
    const nextTenant = await tenantService.get(tenantId)
    setTenant(nextTenant)
    setIdentity(tenantDraftFrom(nextTenant))

    const [contactPage, addressPage] = await Promise.allSettled([
      tenantContactService.list(tenantId),
      tenantAddressService.list(tenantId),
    ])
    if (contactPage.status === 'fulfilled') setContacts(contactPage.value.data)
    if (addressPage.status === 'fulfilled') setAddresses(addressPage.value.data)
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
    setActionBusy(true)
    try {
      await action()
      await reload()
      toast.success(success)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setActionBusy(false)
    }
  }

  async function saveIdentity() {
    const errors = tenantFieldErrors(identity, 'update')
    setIdentityErrors(errors)
    if (Object.keys(errors).length) return
    setSavingIdentity(true)
    try {
      await tenantService.update(tenant!.id, updateTenantPayload(identity))
      await reload()
      toast.success('Tenant updated')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSavingIdentity(false)
    }
  }

  const sectionIndex = SECTIONS.findIndex((item) => item.id === section)

  return (
    <div className="flex flex-1 flex-col gap-5">
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
                <ArrowLeft className="size-4" />
                Back to tenants
              </Link>
            </Button>
            {lifecycleFor(tenant.status).canActivate ? (
              <Button
                variant="outline"
                loading={actionBusy}
                onClick={() => void run(() => tenantService.activate(tenant.id), 'Tenant activated')}
              >
                Activate
              </Button>
            ) : null}
            {lifecycleFor(tenant.status).canSuspend ? (
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmAction({
                    title: `Suspend ${tenant.displayName}?`,
                    description: 'The institution will be unavailable until it is activated again.',
                    confirmLabel: 'Suspend',
                    success: 'Tenant suspended',
                    run: () => tenantService.suspend(tenant.id),
                  })
                }
              >
                Suspend
              </Button>
            ) : null}
            {lifecycleFor(tenant.status).canRetire ? (
              <Button
                variant="destructive"
                onClick={() =>
                  setConfirmAction({
                    title: `Retire ${tenant.displayName}?`,
                    description: 'The institution will be retired and no longer active on the platform.',
                    confirmLabel: 'Retire',
                    success: 'Tenant retired',
                    run: () => tenantService.retire(tenant.id),
                  })
                }
              >
                Retire
              </Button>
            ) : null}
          </>
        }
      />

      <div className="portal-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <ol className="grid gap-3 sm:grid-cols-3">
            {SECTIONS.map((item, index) => {
              const active = item.id === section
              const done = index < sectionIndex
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSection(item.id)}
                    className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/40"
                  >
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
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block text-sm font-medium',
                          active || done ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="p-5 sm:p-6">
          {section === 'info' ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Tenant information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update the institution identity and location details.
                </p>
              </div>
              <TenantFields
                mode="update"
                value={identity}
                errors={identityErrors}
                onChange={(next) => {
                  setIdentity(next)
                  if (Object.keys(identityErrors).length) {
                    setIdentityErrors(tenantFieldErrors(next, 'update'))
                  }
                }}
              />
              <div className="flex justify-end">
                <Button loading={savingIdentity} onClick={() => void saveIdentity()}>
                  Save changes
                </Button>
              </div>
            </section>
          ) : null}

          {section === 'contacts' ? (
            <TenantContactsPanel tenantId={tenant.id} contacts={contacts} onReload={reload} />
          ) : null}

          {section === 'addresses' ? (
            <TenantAddressesPanel tenantId={tenant.id} addresses={addresses} onReload={reload} />
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        confirmLabel={confirmAction?.confirmLabel}
        pending={confirming}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        onConfirm={async () => {
          if (!confirmAction) return
          setConfirming(true)
          try {
            await confirmAction.run()
            await reload()
            toast.success(confirmAction.success)
            setConfirmAction(null)
          } catch (error) {
            toast.error(errorMessage(error))
          } finally {
            setConfirming(false)
          }
        }}
      />
    </div>
  )
}
