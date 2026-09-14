import { useEffect, useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/field'
import { PasswordInput } from '@/components/password-input'
import { errorMessage } from '@/lib/auth'
import { OAuthClientType, type CatalogApplication, type CreateOAuthClientResponse } from '@/lib/types'
import { oauthClientService } from '@/services/platform'

type Draft = {
  applicationId: string
  clientId: string
  clientName: string
  clientType: OAuthClientType
  redirectUris: string
  clientSecret: string
}

function emptyDraft(applications: CatalogApplication[]): Draft {
  return {
    applicationId: applications[0]?.id ?? '',
    clientId: '',
    clientName: '',
    clientType: OAuthClientType.CONFIDENTIAL,
    redirectUris: '',
    clientSecret: '',
  }
}

function parseRedirectUris(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function validateDraft(draft: Draft) {
  if (!draft.applicationId) return 'Select an application'
  if (!draft.clientId.trim()) return 'Client ID is required'
  if (!draft.clientName.trim()) return 'Client name is required'
  const redirectUris = parseRedirectUris(draft.redirectUris)
  if (!redirectUris.length) return 'Add at least one redirect URI'
  if (draft.clientType === OAuthClientType.CONFIDENTIAL && draft.clientSecret.trim().length < 16) {
    return 'Client secret must be at least 16 characters for confidential clients'
  }
  return null
}

function randomSecret(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let value = ''
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  for (const byte of bytes) value += chars[byte % chars.length]
  return value
}

export function CreateOAuthClientDialog({
  open,
  onOpenChange,
  applications,
  defaultApplicationId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applications: CatalogApplication[]
  defaultApplicationId?: string
  onCreated: (client: CreateOAuthClientResponse) => void
}) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(applications))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const applicationId = defaultApplicationId ?? applications[0]?.id ?? ''
    const app = applications.find((item) => item.id === applicationId)
    setDraft({
      ...emptyDraft(applications),
      applicationId,
      clientName: app?.name ?? '',
      clientId: app ? app.applicationCode.toLowerCase().replace(/_/g, '-') : '',
    })
  }, [applications, defaultApplicationId, open])

  async function save() {
    const error = validateDraft(draft)
    if (error) {
      toast.error(error)
      return
    }

    setBusy(true)
    try {
      const redirectUris = parseRedirectUris(draft.redirectUris)
      const created = await oauthClientService.create({
        application_id: draft.applicationId,
        client_id: draft.clientId.trim(),
        client_name: draft.clientName.trim(),
        client_type: draft.clientType,
        redirect_uris: redirectUris,
        client_secret:
          draft.clientType === OAuthClientType.CONFIDENTIAL ? draft.clientSecret.trim() : undefined,
      })
      onOpenChange(false)
      onCreated(created)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const selectedApp = applications.find((app) => app.id === draft.applicationId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register OAuth client</DialogTitle>
          <DialogDescription>
            POST /oauth/client{selectedApp ? ` for ${selectedApp.applicationCode}` : ''}. The client secret is only
            returned once at creation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-1">
          <Field label="Application" required>
            <Select
              value={draft.applicationId || undefined}
              onValueChange={(value) => setDraft((current) => ({ ...current, applicationId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select application" />
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name} ({app.applicationCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Client ID" required>
            <Input
              value={draft.clientId}
              placeholder="alumni-web"
              onChange={(e) => setDraft((current) => ({ ...current, clientId: e.target.value }))}
            />
          </Field>
          <Field label="Client name" required>
            <Input
              value={draft.clientName}
              placeholder="Alumni Web App"
              onChange={(e) => setDraft((current) => ({ ...current, clientName: e.target.value }))}
            />
          </Field>
          <Field label="Client type" required>
            <Select
              value={draft.clientType}
              onValueChange={(value) =>
                setDraft((current) => ({ ...current, clientType: value as OAuthClientType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OAuthClientType.CONFIDENTIAL}>Confidential</SelectItem>
                <SelectItem value={OAuthClientType.PUBLIC}>Public</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Redirect URIs" required hint="One URI per line">
            <Textarea
              value={draft.redirectUris}
              rows={4}
              placeholder={'http://localhost:3001/callback\nhttps://app.example.edu/callback'}
              onChange={(e) => setDraft((current) => ({ ...current, redirectUris: e.target.value }))}
            />
          </Field>
          {draft.clientType === OAuthClientType.CONFIDENTIAL ? (
            <Field label="Client secret" required hint="Minimum 16 characters">
              <div className="flex gap-2">
                <PasswordInput
                  className="flex-1"
                  value={draft.clientSecret}
                  onChange={(e) => setDraft((current) => ({ ...current, clientSecret: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft((current) => ({ ...current, clientSecret: randomSecret() }))}
                >
                  Generate
                </Button>
              </div>
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button disabled={busy || !applications.length} onClick={() => void save()}>
            {busy ? 'Registering…' : 'Register client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
