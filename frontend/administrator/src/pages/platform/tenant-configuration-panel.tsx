import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ConfigurationFields } from '@/components/configuration-fields'
import { SectionTitle } from '@/components/section-title'
import { errorMessage } from '@/lib/auth'
import {
  configurationDraftFrom,
  configurationPayload,
  emptyConfigurationDraft,
  validateConfiguration,
} from '@/lib/configuration'
import type { TenantAsset, TenantConfiguration } from '@/lib/types'
import { tenantConfigurationService } from '@/services/platform'

export function TenantConfigurationPanel({
  tenantId,
  configuration,
  assets,
  onReload,
}: {
  tenantId: string
  configuration: TenantConfiguration | null
  assets: TenantAsset[]
  onReload: () => Promise<void>
}) {
  const [draft, setDraft] = useState(() =>
    configuration ? configurationDraftFrom(configuration) : emptyConfigurationDraft(),
  )
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploadedAssets, setUploadedAssets] = useState<TenantAsset[]>([])

  async function save() {
    const error = validateConfiguration(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const payload = configurationPayload(draft)
      if (configuration) await tenantConfigurationService.update(tenantId, payload)
      else await tenantConfigurationService.create(tenantId, payload)
      toast.success(configuration ? 'Configuration updated' : 'Configuration created')
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="pb-8">
      <SectionTitle
        title="Configuration"
        description="Locale, timezone, currency, and branding. Upload a logo or favicon to attach it automatically."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            {configuration ? (
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                Delete configuration
              </Button>
            ) : null}
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : configuration ? 'Update configuration' : 'Add configuration'}
            </Button>
          </div>
        }
      />
      <ConfigurationFields
        value={draft}
        onChange={setDraft}
        assets={[...uploadedAssets, ...assets]}
        tenantId={tenantId}
        onAssetUploaded={(asset) =>
          setUploadedAssets((current) => [asset, ...current.filter((row) => row.id !== asset.id)])
        }
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Remove this configuration?"
        description="Locale, timezone, and branding settings for this institution will be removed."
        pending={busy}
        onOpenChange={setConfirmDelete}
        onConfirm={async () => {
          setBusy(true)
          try {
            await tenantConfigurationService.delete(tenantId)
            toast.success('Configuration removed')
            setDraft(emptyConfigurationDraft())
            setConfirmDelete(false)
            await onReload()
          } catch (error) {
            toast.error(errorMessage(error))
          } finally {
            setBusy(false)
          }
        }}
      />
    </section>
  )
}
