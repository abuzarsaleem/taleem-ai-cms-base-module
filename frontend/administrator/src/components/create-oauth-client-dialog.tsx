import { useEffect, useState } from 'react'
import { ArrowRight, Lock } from 'lucide-react'
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

type FieldErrors = Partial<Record<keyof Draft, string>>

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

function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {}
  if (!draft.applicationId) errors.applicationId = 'Select an application'
  if (!draft.clientId.trim()) errors.clientId = 'Client ID is required'
  if (!draft.clientName.trim()) errors.clientName = 'Client name is required'
  if (!parseRedirectUris(draft.redirectUris).length) {
    errors.redirectUris = 'Add at least one redirect URI'
  }
  if (draft.clientType === OAuthClientType.CONFIDENTIAL && draft.clientSecret.trim().length < 16) {
    errors.clientSecret = 'Client secret must be at least 16 characters'
  }
  return errors
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
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const applicationId = defaultApplicationId ?? applications[0]?.id ?? ''
    const app = applications.find((item) => item.id === applicationId)
    setErrors({})
    setDraft({
      ...emptyDraft(applications),
      applicationId,
      clientName: app?.name ?? '',
      clientId: app ? app.applicationCode.toLowerCase().replace(/_/g, '-') : '',
    })
  }, [applications, defaultApplicationId, open])

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function save() {
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl" showCloseButton>
        <SheetHeader className="border-b border-border pr-12">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="size-4" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold">Register OAuth client</SheetTitle>
              <SheetDescription>
                Register a client{selectedApp ? ` for ${selectedApp.applicationCode}` : ''}. The client
                secret is only returned once at creation.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <Field label="Application" required error={errors.applicationId}>
            <SearchableSelect
              value={draft.applicationId || undefined}
              onValueChange={(value) => patch('applicationId', value)}
              placeholder="Select application"
              options={applications.map((app) => ({
                value: app.id,
                label: app.name,
                description: app.applicationCode,
              }))}
            />
          </Field>
          <Field label="Client ID" required error={errors.clientId}>
            <Input
              value={draft.clientId}
              placeholder="alumni-web"
              onChange={(e) => patch('clientId', e.target.value)}
            />
          </Field>
          <Field label="Client name" required error={errors.clientName}>
            <Input
              value={draft.clientName}
              placeholder="Alumni Web App"
              onChange={(e) => patch('clientName', e.target.value)}
            />
          </Field>
          <Field label="Client type" required>
            <SearchableSelect
              value={draft.clientType}
              onValueChange={(value) => patch('clientType', value as OAuthClientType)}
              options={[
                { value: OAuthClientType.CONFIDENTIAL, label: 'Confidential' },
                { value: OAuthClientType.PUBLIC, label: 'Public' },
              ]}
              placeholder="Select client type"
            />
          </Field>
          <Field label="Redirect URIs" required hint="One URI per line" error={errors.redirectUris}>
            <Textarea
              value={draft.redirectUris}
              rows={4}
              placeholder={'http://localhost:3001/callback\nhttps://app.example.edu/callback'}
              onChange={(e) => patch('redirectUris', e.target.value)}
            />
          </Field>
          {draft.clientType === OAuthClientType.CONFIDENTIAL ? (
            <Field label="Client secret" required hint="Minimum 16 characters" error={errors.clientSecret}>
              <div className="flex gap-2">
                <PasswordInput
                  className="flex-1"
                  value={draft.clientSecret}
                  onChange={(e) => patch('clientSecret', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => patch('clientSecret', randomSecret())}
                >
                  Generate
                </Button>
              </div>
            </Field>
          ) : null}
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border sm:flex-row">
          <Button type="button" variant="outline" loading={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!applications.length} onClick={() => void save()}>
            Register client
            {!busy ? <ArrowRight className="size-4" /> : null}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
