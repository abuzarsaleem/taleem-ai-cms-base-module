import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfigurationFields } from '@/components/configuration-fields'
import { IdentifierFields } from '@/components/identifier-fields'
import { SmtpFields } from '@/components/smtp-fields'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import {
  configurationDraftFrom,
  configurationFieldErrors,
  configurationPayload,
  emptyConfigurationDraft,
  type ConfigurationDraft,
} from '@/lib/configuration'
import {
  emptyIdentifierDraft,
  identifierDraftFrom,
  identifierFieldErrors,
  identifierPayload,
  type IdentifierDraft,
} from '@/lib/identifier'
import {
  emptySmtpDraft,
  smtpDraftFrom,
  smtpFieldErrors,
  smtpPayload,
  type SmtpDraft,
} from '@/lib/smtp'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { cn, labelize } from '@/lib/utils'
import type { TenantAsset, TenantIdentifier } from '@/lib/types'
import {
  tenantAssetService,
  tenantConfigurationService,
  tenantIdentifierService,
  tenantSmtpService,
} from '@/services/platform'
import { TenantPicker } from '@/pages/platform/resource-workspace'

const STEPS = [
  {
    id: 'branding',
    title: 'Branding & Localization',
    description: 'Visual identity and regional settings',
  },
  {
    id: 'identifiers',
    title: 'Identifiers',
    description: 'Institutional registration codes',
  },
  {
    id: 'smtp',
    title: 'SMTP',
    description: 'Outgoing email delivery settings',
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Confirm and save configuration',
  },
] as const

type LocalIdentifier = IdentifierDraft & { localId: string; serverId?: string }

function newId() {
  return crypto.randomUUID()
}

export function PlatformConfigurationFormPage() {
  const navigate = useNavigate()
  const { tenantId: routeTenantId } = useParams()
  const [searchParams] = useSearchParams()
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const isEdit = Boolean(routeTenantId)

  const [step, setStep] = useState(0)
  const [formTenantId, setFormTenantId] = useState(routeTenantId || searchParams.get('tenantId') || '')
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [configDraft, setConfigDraft] = useState(emptyConfigurationDraft())
  const [configErrors, setConfigErrors] = useState<Partial<Record<keyof ConfigurationDraft, string>>>({})
  const [configExists, setConfigExists] = useState(false)
  const [identifiers, setIdentifiers] = useState<LocalIdentifier[]>([])
  const [initialIdentifierIds, setInitialIdentifierIds] = useState<string[]>([])
  const [smtpDraft, setSmtpDraft] = useState(emptySmtpDraft())
  const [smtpErrors, setSmtpErrors] = useState<Partial<Record<keyof SmtpDraft, string>>>({})
  const [smtpExists, setSmtpExists] = useState(false)
  const [assets, setAssets] = useState<TenantAsset[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  const [identifierOpen, setIdentifierOpen] = useState(false)
  const [identifierEditingId, setIdentifierEditingId] = useState<string | null>(null)
  const [identifierDraft, setIdentifierDraft] = useState(emptyIdentifierDraft())
  const [identifierErrors, setIdentifierErrors] = useState<Partial<Record<keyof IdentifierDraft, string>>>({})

  useEffect(() => {
    if (!formTenantId) {
      setAssets([])
      return
    }
    tenantAssetService
      .list(formTenantId, 1, 100)
      .then((result) => setAssets(result.data))
      .catch(() => setAssets([]))
  }, [formTenantId])

  useEffect(() => {
    if (!formTenantId) return
    let cancelled = false
    setLoading(true)

    async function loadTenantConfig() {
      try {
        const [configResult, identifierResult, smtpResult] = await Promise.allSettled([
          tenantConfigurationService.get(formTenantId),
          tenantIdentifierService.list(formTenantId, 1, 100),
          tenantSmtpService.get(formTenantId),
        ])

        if (cancelled) return

        if (configResult.status === 'fulfilled') {
          setConfigDraft(configurationDraftFrom(configResult.value))
          setConfigExists(true)
        } else if (configResult.reason instanceof ApiError && configResult.reason.status === 404) {
          setConfigDraft(emptyConfigurationDraft())
          setConfigExists(false)
        } else if (configResult.status === 'rejected') {
          throw configResult.reason
        }

        if (identifierResult.status === 'fulfilled') {
          const rows = identifierResult.value.data.map((row: TenantIdentifier) => ({
            ...identifierDraftFrom(row),
            localId: row.id,
            serverId: row.id,
          }))
          setIdentifiers(rows)
          setInitialIdentifierIds(rows.map((row) => row.serverId!).filter(Boolean))
        } else {
          setIdentifiers([])
          setInitialIdentifierIds([])
        }

        if (smtpResult.status === 'fulfilled') {
          setSmtpDraft(smtpDraftFrom(smtpResult.value))
          setSmtpExists(true)
        } else if (smtpResult.reason instanceof ApiError && smtpResult.reason.status === 404) {
          setSmtpDraft(emptySmtpDraft())
          setSmtpExists(false)
        } else if (smtpResult.status === 'rejected') {
          throw smtpResult.reason
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(errorMessage(error))
          if (isEdit) navigate('/platform/configuration', { replace: true })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadTenantConfig()
    return () => {
      cancelled = true
    }
  }, [formTenantId, isEdit, navigate])

  const current = STEPS[step]
  const selectedTenant = tenants.find((tenant) => tenant.id === formTenantId)

  function requireTenant() {
    if (formTenantId) {
      setTenantError(null)
      return true
    }
    setTenantError('Select a tenant')
    return false
  }

  function goNext() {
    if (!requireTenant()) return
    if (step === 0) {
      const errors = configurationFieldErrors(configDraft)
      setConfigErrors(errors)
      if (Object.keys(errors).length) return
    }
    if (step === 2) {
      const errors = smtpFieldErrors(smtpDraft)
      setSmtpErrors(errors)
      if (Object.keys(errors).length) return
    }
    setStep((value) => Math.min(value + 1, STEPS.length - 1))
  }

  function goPrev() {
    setStep((value) => Math.max(value - 1, 0))
  }

  function openIdentifierCreate() {
    setIdentifierEditingId(null)
    setIdentifierDraft(emptyIdentifierDraft())
    setIdentifierErrors({})
    setIdentifierOpen(true)
  }

  function openIdentifierEdit(row: LocalIdentifier) {
    const { localId, serverId: _serverId, ...draft } = row
    setIdentifierEditingId(localId)
    setIdentifierDraft(draft)
    setIdentifierErrors({})
    setIdentifierOpen(true)
  }

  function saveIdentifier() {
    const errors = identifierFieldErrors(identifierDraft)
    setIdentifierErrors(errors)
    if (Object.keys(errors).length) return
    if (identifierEditingId) {
      setIdentifiers((rows) =>
        rows.map((row) =>
          row.localId === identifierEditingId
            ? { ...identifierDraft, localId: row.localId, serverId: row.serverId }
            : row,
        ),
      )
    } else {
      setIdentifiers((rows) => [...rows, { ...identifierDraft, localId: newId() }])
    }
    setIdentifierOpen(false)
  }

  async function persistAll(navigateAway = true) {
    if (!requireTenant()) {
      setStep(0)
      return
    }
    const nextConfigErrors = configurationFieldErrors(configDraft)
    setConfigErrors(nextConfigErrors)
    if (Object.keys(nextConfigErrors).length) {
      setStep(0)
      return
    }
    const nextSmtpErrors = smtpFieldErrors(smtpDraft)
    setSmtpErrors(nextSmtpErrors)
    if (Object.keys(nextSmtpErrors).length) {
      setStep(2)
      return
    }

    setBusy(true)
    try {
      const configBody = configurationPayload(configDraft)
      if (configExists) await tenantConfigurationService.update(formTenantId, configBody)
      else {
        await tenantConfigurationService.create(formTenantId, configBody)
        setConfigExists(true)
      }

      const keptServerIds = new Set(
        identifiers.map((row) => row.serverId).filter((id): id is string => Boolean(id)),
      )
      for (const id of initialIdentifierIds) {
        if (!keptServerIds.has(id)) await tenantIdentifierService.delete(formTenantId, id)
      }
      for (const row of identifiers) {
        const body = identifierPayload(row, row.serverId ? 'update' : 'create')
        if (row.serverId) await tenantIdentifierService.update(formTenantId, row.serverId, body)
        else await tenantIdentifierService.create(formTenantId, body)
      }

      const smtpBody = smtpPayload(smtpDraft)
      if (smtpExists) await tenantSmtpService.update(formTenantId, smtpBody)
      else {
        await tenantSmtpService.create(formTenantId, smtpBody)
        setSmtpExists(true)
      }

      toast.success('Tenant configuration saved')
      if (navigateAway) navigate('/platform/configuration')
      else {
        const refreshed = await tenantIdentifierService.list(formTenantId, 1, 100)
        const rows = refreshed.data.map((row) => ({
          ...identifierDraftFrom(row),
          localId: row.id,
          serverId: row.id,
        }))
        setIdentifiers(rows)
        setInitialIdentifierIds(rows.map((row) => row.serverId!).filter(Boolean))
      }
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if ((loading && isEdit) || tenantsLoading) {
    return <Skeleton className="h-96 rounded-[var(--radius)]" />
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="Tenant configuration"
        title="Configure tenant"
        description="Configure tenant-level branding, identifiers and email delivery settings."
        actions={
          <Button variant="outline" asChild>
            <Link to="/platform/configuration">
              <ArrowLeft className="size-4" />
              Back to configurations
            </Link>
          </Button>
        }
      />

      {selectedTenant ? (
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
          <p className="font-medium">{selectedTenant.displayName}</p>
          <p className="text-muted-foreground">Tenant being configured · {selectedTenant.tenantCode}</p>
        </div>
      ) : null}

      <div className="portal-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <ol className="grid gap-3 sm:grid-cols-4">
            {STEPS.map((item, index) => {
              const done = index < step
              const active = index === step
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    className="flex w-full items-start gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-muted/40"
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

        <div className="space-y-5 p-5 sm:p-6">
          {current.id === 'branding' ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Branding & Localization</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set the tenant&apos;s basic information, localization and visual identity.
                </p>
              </div>
              {!isEdit ? (
                <div className="space-y-1.5">
                  <TenantPicker
                    tenants={tenants}
                    value={formTenantId}
                    onChange={(value) => {
                      setFormTenantId(value)
                      setTenantError(null)
                      setConfigExists(false)
                      setSmtpExists(false)
                      setConfigDraft(emptyConfigurationDraft())
                      setSmtpDraft(emptySmtpDraft())
                      setIdentifiers([])
                      setInitialIdentifierIds([])
                    }}
                  />
                  {tenantError ? <p className="text-xs text-destructive">{tenantError}</p> : null}
                </div>
              ) : null}
              <ConfigurationFields
                value={configDraft}
                errors={configErrors}
                assets={assets}
                tenantId={formTenantId || undefined}
                onAssetUploaded={(asset) =>
                  setAssets((current) => [asset, ...current.filter((row) => row.id !== asset.id)])
                }
                onChange={(next) => {
                  setConfigDraft(next)
                  if (Object.keys(configErrors).length) setConfigErrors(configurationFieldErrors(next))
                }}
              />
            </section>
          ) : null}

          {current.id === 'identifiers' ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight">Identifiers</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add institutional identifiers for this tenant. Types come from the platform catalogue.
                  </p>
                </div>
                <Button onClick={openIdentifierCreate} disabled={!formTenantId}>
                  <Plus className="size-4" />
                  Add identifier
                </Button>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Issuing authority</TableHead>
                      <TableHead>Issue date</TableHead>
                      <TableHead>Expiry date</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {identifiers.map((row, index) => (
                      <TableRow key={row.localId}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>{labelize(row.identifierType)}</TableCell>
                        <TableCell className="font-mono text-xs">{row.identifierValue}</TableCell>
                        <TableCell>{row.issuingAuthority || '—'}</TableCell>
                        <TableCell>{row.issueDate || '—'}</TableCell>
                        <TableCell>{row.expiryDate || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openIdentifierEdit(row)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setIdentifiers((rows) => rows.filter((item) => item.localId !== row.localId))
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!identifiers.length ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          No identifiers yet. Click &quot;Add identifier&quot; to add one.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
              <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                You can add multiple identifiers for a tenant. Identifier types are managed in the platform catalogue.
              </p>
            </section>
          ) : null}

          {current.id === 'smtp' ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">SMTP Configuration</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure the outgoing email server and sender identity for this tenant.
                </p>
              </div>
              <SmtpFields
                value={smtpDraft}
                errors={smtpErrors}
                onChange={(next) => {
                  setSmtpDraft(next)
                  if (Object.keys(smtpErrors).length) setSmtpErrors(smtpFieldErrors(next))
                }}
              />
            </section>
          ) : null}

          {current.id === 'review' ? (
            <section className="mx-auto grid max-w-3xl gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Review & Submit</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm branding, identifiers, and SMTP settings before saving.
                </p>
              </div>
              <ReviewSection
                step={1}
                title="Branding & Localization"
                description="Visual identity and regional settings for this tenant."
                onEdit={() => setStep(0)}
              >
                <ReviewRow label="Branding name" value={configDraft.brandingName || '—'} />
                <ReviewRow label="Timezone" value={configDraft.timezone || '—'} />
                <ReviewRow label="Locale" value={configDraft.locale || '—'} />
                <ReviewRow label="Date format" value={configDraft.dateFormat || '—'} />
                <ReviewRow label="Currency" value={configDraft.currencyCode || '—'} />
                <ReviewRow label="Font family" value={configDraft.fontFamily || '—'} />
                <div className="flex flex-wrap gap-3 pt-2">
                  <ColorSwatch label="Primary" value={configDraft.primaryColor} />
                  <ColorSwatch label="Secondary" value={configDraft.secondaryColor} />
                  <ColorSwatch label="Accent" value={configDraft.accentColor} />
                </div>
              </ReviewSection>
              <ReviewSection
                step={2}
                title="Identifiers"
                description="Institutional identifiers for this tenant."
                onEdit={() => setStep(1)}
              >
                {identifiers.length ? (
                  <div className="overflow-hidden rounded-lg border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>#</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Authority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {identifiers.map((row, index) => (
                          <TableRow key={row.localId}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{labelize(row.identifierType)}</TableCell>
                            <TableCell className="font-mono text-xs">{row.identifierValue}</TableCell>
                            <TableCell>{row.issuingAuthority || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No identifiers added.</p>
                )}
              </ReviewSection>
              <ReviewSection
                step={3}
                title="SMTP Configuration"
                description="Outgoing email server configuration for this tenant."
                onEdit={() => setStep(2)}
              >
                <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <ReviewRow label="Host" value={smtpDraft.host || '—'} />
                  <ReviewRow label="Port" value={smtpDraft.port || '—'} />
                  <ReviewRow label="Username" value={smtpDraft.username || '—'} />
                  <ReviewRow label="Encryption" value={smtpDraft.encryption} />
                  <ReviewRow label="From name" value={smtpDraft.fromName || '—'} />
                  <ReviewRow label="From email" value={smtpDraft.fromEmail || '—'} />
                  <ReviewRow label="Reply-to" value={smtpDraft.replyToEmail || '—'} />
                  <div className="py-2">
                    <StatusBadge value={smtpDraft.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                </div>
              </ReviewSection>
            </section>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <Button variant="outline" asChild>
            <Link to="/platform/configuration">Cancel</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={goPrev} loading={busy}>
                <ArrowLeft className="size-4" />
                Previous
              </Button>
            ) : null}
            <Button variant="outline" loading={busy} onClick={() => void persistAll(false)}>
              Save as draft
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext} loading={busy}>
                Next: {STEPS[step + 1].title}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button loading={busy} onClick={() => void persistAll(true)}>
                Submit configuration
              </Button>
            )}
          </div>
        </div>
      </div>

      <Sheet open={identifierOpen} onOpenChange={setIdentifierOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>{identifierEditingId ? 'Edit identifier' : 'Add identifier'}</SheetTitle>
            <SheetDescription>Type and value are required.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <IdentifierFields
              value={identifierDraft}
              errors={identifierErrors}
              onChange={(next) => {
                setIdentifierDraft(next)
                if (Object.keys(identifierErrors).length) setIdentifierErrors(identifierFieldErrors(next))
              }}
            />
          </div>
          <SheetFooter className="border-t border-border">
            <Button variant="outline" onClick={() => setIdentifierOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveIdentifier}>{identifierEditingId ? 'Save changes' : 'Add identifier'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ReviewSection({
  step,
  title,
  description,
  onEdit,
  children,
}: {
  step: number
  title: string
  description: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {step}
          </span>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </div>
      {children}
    </section>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-all">{value}</span>
    </div>
  )
}

function ColorSwatch({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="size-5 rounded-full border border-border" style={{ backgroundColor: value }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
