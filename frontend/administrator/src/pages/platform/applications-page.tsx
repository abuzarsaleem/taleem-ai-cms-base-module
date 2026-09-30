import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ImagePlus,
  LayoutGrid,
  Lock,
  Pencil,
  Plus,
  Shield,
  XCircle,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { ApplicationIcon } from '@/components/application-icon'
import { ApplicationRolesDrawer } from '@/components/application-roles-drawer'
import { CreateOAuthClientDialog } from '@/components/create-oauth-client-dialog'
import { Field } from '@/components/field'
import { FilterBar, FilterSearch, FilterSelect } from '@/components/filters'
import { PageHeader } from '@/components/page-header'
import { StatMetricCard } from '@/components/stat-metric-card'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { isDisplayableImageUrl } from '@/lib/utils'
import {
  ApplicationStatus,
  type ApplicationCatalogueStats,
  type CatalogApplication,
  type CreateOAuthClientResponse,
} from '@/lib/types'
import { applicationService } from '@/services/platform'

const DESCRIPTION_MAX = 250

const emptyDraft = {
  applicationCode: '',
  name: '',
  version: '',
  launchUrl: '',
  description: '',
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

export function ApplicationsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [logoUrl, setLogoUrl] = useState<string | undefined>()
  const [pendingLogo, setPendingLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<CatalogApplication[]>([])
  const [stats, setStats] = useState<ApplicationCatalogueStats | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL')
  const [oauthOpen, setOauthOpen] = useState(false)
  const [oauthDefaultAppId, setOauthDefaultAppId] = useState<string | undefined>()
  const [createdSecret, setCreatedSecret] = useState<CreateOAuthClientResponse | null>(null)
  const [rolesApp, setRolesApp] = useState<CatalogApplication | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    applicationCode?: string
    launchUrl?: string
  }>({})

  async function load() {
    const result = await applicationService.list(1, 100)
    setRows(result.data)
    setStats(result.stats)
  }

  useEffect(() => {
    load()
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((app) => {
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false
      if (!q) return true
      return (
        app.name.toLowerCase().includes(q) ||
        app.applicationCode.toLowerCase().includes(q) ||
        (app.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, search, statusFilter])

  function resetLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
    setPendingLogo(null)
    setLogoUrl(undefined)
    if (fileRef.current) fileRef.current.value = ''
  }

  function closeDrawer() {
    setOpen(false)
    setEditingId(null)
    setDraft(emptyDraft)
    setFieldErrors({})
    resetLogo()
  }

  function openCreate() {
    setEditingId(null)
    setDraft(emptyDraft)
    setFieldErrors({})
    resetLogo()
    setOpen(true)
  }

  async function openEdit(applicationId: string) {
    try {
      const app = await applicationService.get(applicationId)
      setEditingId(app.id)
      setDraft({
        applicationCode: app.applicationCode,
        name: app.name,
        version: app.version ?? '',
        launchUrl: app.launchUrl ?? '',
        description: app.description ?? '',
      })
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      setLogoPreview(null)
      setPendingLogo(null)
      setLogoUrl(app.logoUrl)
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function applyLogo(applicationId: string, file: File) {
    const updated = await applicationService.uploadLogo(applicationId, file)
    setLogoUrl(updated.logoUrl)
    setPendingLogo(null)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
    return updated
  }

  async function onPickLogo(file?: File) {
    if (!file) return
    if (file.size > 1024 * 1024) {
      toast.error('Logo must be 1MB or smaller')
      return
    }
    const preview = URL.createObjectURL(file)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(preview)
    setPendingLogo(file)
    if (!editingId) return
    setBusy(true)
    try {
      await applyLogo(editingId, file)
      await load()
      toast.success('Logo uploaded')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onClearLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
    setPendingLogo(null)
    if (fileRef.current) fileRef.current.value = ''
    if (!editingId || !logoUrl) {
      setLogoUrl(undefined)
      return
    }
    setBusy(true)
    try {
      await applicationService.removeLogo(editingId)
      setLogoUrl(undefined)
      await load()
      toast.success('Logo removed')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function save(setupOAuth = false) {
    const nextErrors: typeof fieldErrors = {}
    if (!draft.name.trim()) nextErrors.name = 'Application name is required'
    if (!editingId && !draft.applicationCode.trim()) {
      nextErrors.applicationCode = 'Application code is required'
    }
    if (draft.launchUrl.trim()) {
      try {
        // eslint-disable-next-line no-new
        new URL(draft.launchUrl.trim())
      } catch {
        nextErrors.launchUrl = 'Enter a valid URL'
      }
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setBusy(true)
    try {
      if (editingId) {
        await applicationService.update(editingId, {
          name: draft.name.trim(),
          description: optional(draft.description),
          version: optional(draft.version),
          launchUrl: optional(draft.launchUrl),
        })
        if (pendingLogo) await applyLogo(editingId, pendingLogo)
        toast.success('Application updated')
        closeDrawer()
        await load()
        return
      }

      const created = await applicationService.create({
        applicationCode: draft.applicationCode.trim(),
        name: draft.name.trim(),
        description: optional(draft.description),
        version: optional(draft.version),
        launchUrl: optional(draft.launchUrl),
      })
      if (pendingLogo) await applyLogo(created.id, pendingLogo)
      closeDrawer()
      await load()
      toast.success('Application registered')
      if (setupOAuth) {
        setOauthDefaultAppId(created.id)
        setOauthOpen(true)
      }
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const previewUrl = logoPreview || logoUrl
  const isEdit = Boolean(editingId)

  const statCards = [
    {
      title: 'Total Applications',
      value: stats?.total ?? rows.length,
      delta: stats?.vsPreviousMonth.total ?? 0,
      icon: LayoutGrid,
      tone: 'violet' as const,
    },
    {
      title: 'Active',
      value: stats?.active ?? rows.filter((r) => r.status === ApplicationStatus.ACTIVE).length,
      delta: stats?.vsPreviousMonth.active ?? 0,
      icon: CheckCircle2,
      tone: 'green' as const,
    },
    {
      title: 'Inactive',
      value: stats?.inactive ?? rows.filter((r) => r.status === ApplicationStatus.INACTIVE).length,
      delta: stats?.vsPreviousMonth.inactive ?? 0,
      icon: XCircle,
      tone: 'amber' as const,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        eyebrow="Catalogue"
        title="Application catalogue"
        description="Register independently deployable applications. The catalogue does not store application business data."
        quote={['Modular applications', 'for modern education']}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Register application
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-3">
          {statCards.map((card) => (
            <StatMetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              delta={card.delta}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </section>
      )}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <FilterBar
          className="border-b border-border p-3"
          canClear={Boolean(search) || statusFilter !== 'ALL'}
          onClear={() => {
            setSearch('')
            setStatusFilter('ALL')
          }}
        >
          <FilterSearch value={search} onChange={setSearch} placeholder="Search applications by name or code..." />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'ALL' | ApplicationStatus)}
            options={[
              { value: 'ALL', label: 'All' },
              { value: ApplicationStatus.ACTIVE, label: 'Active' },
              { value: ApplicationStatus.INACTIVE, label: 'Inactive' },
            ]}
          />
        </FilterBar>

        {loading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>
                  Application
                </TableHead>
                <TableHead>
                  Code
                </TableHead>
                <TableHead>
                  Version
                </TableHead>
                <TableHead>
                  Tenants
                </TableHead>
                <TableHead>
                  Status
                </TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((app) => (
                <TableRow
                  key={app.id}
                  className="cursor-pointer border-border"
                  onClick={() => void openEdit(app.id)}
                >
                  <TableCell className="max-w-[280px]">
                    <div className="flex min-w-0 items-center gap-3">
                      <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{app.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{app.description || '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground/80">{app.applicationCode}</TableCell>
                  <TableCell className="text-foreground/80">{app.version ?? '—'}</TableCell>
                  <TableCell className="tabular-nums text-foreground/80">{app.tenantCount ?? 0}</TableCell>
                  <TableCell>
                    <StatusBadge value={app.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOauthDefaultAppId(app.id)
                          setOauthOpen(true)
                        }}
                      >
                        <Lock className="size-3.5" />
                        OAuth
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRolesApp(app)}>
                        <Shield className="size-3.5" />
                        Roles
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void openEdit(app.id)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      {app.status === ApplicationStatus.ACTIVE ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={actionId === app.id}
                          onClick={() => {
                            setActionId(app.id)
                            applicationService
                              .deactivate(app.id)
                              .then(async () => {
                                await load()
                                toast.success(`${app.name} marked inactive`)
                              })
                              .catch((error) => toast.error(errorMessage(error)))
                              .finally(() => setActionId(null))
                          }}
                        >
                          <XCircle className="size-3.5" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={actionId === app.id}
                          onClick={() => {
                            setActionId(app.id)
                            applicationService
                              .activate(app.id)
                              .then(async () => {
                                await load()
                                toast.success(`${app.name} activated`)
                              })
                              .catch((error) => toast.error(errorMessage(error)))
                              .finally(() => setActionId(null))
                          }}
                        >
                          <CheckCircle2 className="size-3.5" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredRows.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {rows.length ? 'No applications match your filters.' : 'No applications registered yet.'}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDrawer()
          else setOpen(true)
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl"
          showCloseButton
        >
          <SheetHeader className="border-b border-border pr-12">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              </span>
              <div className="min-w-0">
                <SheetTitle className="text-base font-semibold">
                  {isEdit ? 'Edit application' : 'Register application'}
                </SheetTitle>
                <SheetDescription>
                  {isEdit
                    ? 'Update catalogue details and logo for this application.'
                    : 'Add a new application to the platform catalogue.'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Basic information
              </p>
              <Field label="Application name" required error={fieldErrors.name}>
                <Input
                  value={draft.name}
                  placeholder="e.g. Alumni Portal"
                  onChange={(e) => {
                    setDraft((current) => ({ ...current, name: e.target.value }))
                    setFieldErrors((current) => ({ ...current, name: undefined }))
                  }}
                />
              </Field>
              <Field
                label="Application code"
                required
                hint="Unique code (uppercase, no spaces)"
                error={fieldErrors.applicationCode}
              >
                <Input
                  value={draft.applicationCode}
                  disabled={isEdit}
                  placeholder="e.g. ALUMNI"
                  onChange={(e) => {
                    setDraft((current) => ({
                      ...current,
                      applicationCode: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                    }))
                    setFieldErrors((current) => ({ ...current, applicationCode: undefined }))
                  }}
                />
              </Field>
              <Field label="Description">
                <div className="space-y-1.5">
                  <Textarea
                    value={draft.description}
                    maxLength={DESCRIPTION_MAX}
                    placeholder="Brief description of the application..."
                    className="min-h-24"
                    onChange={(e) =>
                      setDraft((current) => ({ ...current, description: e.target.value.slice(0, DESCRIPTION_MAX) }))
                    }
                  />
                  <p className="text-right text-[11px] text-muted-foreground">
                    {draft.description.length}/{DESCRIPTION_MAX}
                  </p>
                </div>
              </Field>
              <Field label="Version">
                <Input
                  value={draft.version}
                  placeholder="e.g. 1.0.0"
                  onChange={(e) => setDraft((current) => ({ ...current, version: e.target.value }))}
                />
              </Field>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Application details
              </p>
              <Field label="Icon" hint="SVG, PNG, JPG, WEBP or GIF (max 1MB)">
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
                  >
                    {isDisplayableImageUrl(previewUrl) ? (
                      <img
                        src={previewUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                        <ImagePlus className="size-5" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {previewUrl ? 'Replace icon' : 'Upload icon'}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {busy ? 'Uploading…' : 'Click to choose an image file'}
                      </span>
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    onChange={(event) => void onPickLogo(event.target.files?.[0])}
                  />
                  {previewUrl ? (
                    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void onClearLogo()}>
                      Remove icon
                    </Button>
                  ) : null}
                </div>
              </Field>
              <Field label="Launch URL" hint="Official application URL tenants can open" error={fieldErrors.launchUrl}>
                <Input
                  value={draft.launchUrl}
                  placeholder="https://example.edu.pk"
                  onChange={(e) => {
                    setDraft((current) => ({ ...current, launchUrl: e.target.value }))
                    setFieldErrors((current) => ({ ...current, launchUrl: undefined }))
                  }}
                />
              </Field>
            </section>
          </div>

          <SheetFooter className="justify-between">
            <Button type="button" variant="outline" disabled={busy} onClick={closeDrawer}>
              Cancel
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              {!isEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  loading={busy}
                  onClick={() => void save(true)}
                >
                  Save & OAuth
                </Button>
              ) : null}
              <Button type="button" loading={busy} onClick={() => void save(false)}>
                {isEdit ? 'Save changes' : 'Register application'}
                {!busy ? <ArrowRight className="size-4" /> : null}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CreateOAuthClientDialog
        open={oauthOpen}
        onOpenChange={setOauthOpen}
        applications={rows}
        defaultApplicationId={oauthDefaultAppId}
        onCreated={(client) => {
          if (client.clientSecret) setCreatedSecret(client)
          toast.success('OAuth client registered')
        }}
      />

      <ApplicationRolesDrawer
        open={Boolean(rolesApp)}
        onOpenChange={(next) => {
          if (!next) setRolesApp(null)
        }}
        application={rolesApp}
      />

      <Dialog open={Boolean(createdSecret)} onOpenChange={(next) => !next && setCreatedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save the client secret</DialogTitle>
            <DialogDescription>
              This secret is shown only once. Copy it now and store it securely for{' '}
              <span className="font-mono">{createdSecret?.clientId}</span>.
            </DialogDescription>
          </DialogHeader>
          {createdSecret?.clientSecret ? (
            <div className="rounded-xl border border-border bg-muted/40 px-3 py-3 font-mono text-sm break-all">
              {createdSecret.clientSecret}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (createdSecret?.clientSecret) {
                  void navigator.clipboard.writeText(createdSecret.clientSecret)
                  toast.success('Client secret copied')
                }
              }}
            >
              <Copy />
              Copy secret
            </Button>
            <Button onClick={() => setCreatedSecret(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
