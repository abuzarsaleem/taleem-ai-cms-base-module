import { useEffect, useRef, useState } from 'react'
import { Copy, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApplicationIcon } from '@/components/application-icon'
import { CreateOAuthClientDialog } from '@/components/create-oauth-client-dialog'
import { Field } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { isDisplayableImageUrl } from '@/lib/utils'
import { ApplicationStatus, type CatalogApplication, type CreateOAuthClientResponse } from '@/lib/types'
import { applicationService } from '@/services/platform'

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
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<CatalogApplication[]>([])
  const [oauthOpen, setOauthOpen] = useState(false)
  const [oauthDefaultAppId, setOauthDefaultAppId] = useState<string | undefined>()
  const [createdSecret, setCreatedSecret] = useState<CreateOAuthClientResponse | null>(null)

  async function load() {
    const result = await applicationService.list(1, 100)
    setRows(result.data)
  }

  useEffect(() => {
    load()
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  function resetLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
    setPendingLogo(null)
    setLogoUrl(undefined)
    if (fileRef.current) fileRef.current.value = ''
  }

  function openCreate() {
    setEditingId(null)
    setDraft(emptyDraft)
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
    if (!draft.name.trim() || (!editingId && !draft.applicationCode.trim())) return
    setBusy(true)
    try {
      if (editingId) {
        await applicationService.update(editingId, {
          name: draft.name.trim(),
          description: optional(draft.description),
          version: optional(draft.version),
          launchUrl: optional(draft.launchUrl),
        })
        toast.success('Application updated')
      } else {
        const created = await applicationService.create({
          applicationCode: draft.applicationCode.trim(),
          name: draft.name.trim(),
          description: optional(draft.description),
          version: optional(draft.version),
          launchUrl: optional(draft.launchUrl),
        })
        if (pendingLogo) await applyLogo(created.id, pendingLogo)
        await load()
        setOpen(false)
        resetLogo()
        if (setupOAuth) {
          setOauthDefaultAppId(created.id)
          setOauthOpen(true)
          toast.success('Application registered')
        } else {
          toast.success('Application registered')
        }
        return
      }
      setOpen(false)
      resetLogo()
      await load()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const canSave = Boolean(draft.name.trim() && (editingId || draft.applicationCode.trim()))

  const previewUrl = logoPreview || logoUrl

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Application catalogue"
        description="Register independently deployable applications. The catalogue does not store application business data."
        actions={<Button onClick={openCreate}>Register application</Button>}
      />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetLogo()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit application' : 'Register application'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'PATCH /application/:id — name, version, launch URL, and description. Upload a logo with POST /application/:id/logo.'
                : 'Unique application identity and launch information. A selected logo is uploaded after the application is created.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Application code" required>
              <Input
                value={draft.applicationCode}
                disabled={Boolean(editingId)}
                onChange={(e) => setDraft((current) => ({ ...current, applicationCode: e.target.value.toUpperCase() }))}
              />
            </Field>
            <Field label="Name" required>
              <Input value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} />
            </Field>
            <Field label="Logo">
              <div className="flex flex-col gap-3">
                {isDisplayableImageUrl(previewUrl) ? (
                  <img src={previewUrl} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={(event) => void onPickLogo(event.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
                    {busy ? 'Uploading…' : previewUrl ? 'Replace logo' : 'Upload logo'}
                  </Button>
                  {previewUrl ? (
                    <Button type="button" variant="outline" disabled={busy} onClick={() => void onClearLogo()}>
                      Remove logo
                    </Button>
                  ) : null}
                </div>
              </div>
            </Field>
            <Field label="Version">
              <Input
                value={draft.version}
                placeholder="1.0.0"
                onChange={(e) => setDraft((current) => ({ ...current, version: e.target.value }))}
              />
            </Field>
            <Field label="Launch URL">
              <Input
                value={draft.launchUrl}
                placeholder="https://app.example.edu"
                onChange={(e) => setDraft((current) => ({ ...current, launchUrl: e.target.value }))}
              />
            </Field>
            <Field label="Description">
              <Input
                value={draft.description}
                onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
              />
            </Field>
          </div>
          <DialogFooter className={editingId ? undefined : 'flex-col gap-2 sm:flex-row sm:justify-end'}>
            {editingId ? (
              <Button disabled={busy || !canSave} onClick={() => void save()}>
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            ) : (
              <>
                <Button variant="outline" disabled={busy || !canSave} onClick={() => void save(false)}>
                  {busy ? 'Saving…' : 'Save'}
                </Button>
                <Button disabled={busy || !canSave} onClick={() => void save(true)}>
                  {busy ? 'Saving…' : 'Save & set up OAuth client'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {loading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--portal-shadow)]">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{app.applicationCode}</TableCell>
                  <TableCell>{app.version ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge value={app.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOauthDefaultAppId(app.id)
                          setOauthOpen(true)
                        }}
                      >
                        <Lock />
                        OAuth
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/platform/applications/${app.id}`}>Access</Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void openEdit(app.id)}>
                        Edit
                      </Button>
                      {app.status === ApplicationStatus.ACTIVE ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            applicationService
                              .deactivate(app.id)
                              .then(async () => {
                                await load()
                                toast.success(`${app.name} marked ineligible`)
                              })
                              .catch((error) => toast.error(errorMessage(error)))
                          }}
                        >
                          Deactivate
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No applications registered yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

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
