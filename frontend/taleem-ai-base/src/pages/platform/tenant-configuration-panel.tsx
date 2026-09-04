import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
        description="Locale, timezone, currency, and branding. Logo fields take asset UUIDs from the Assets section."
        action={
          configuration ? (
            <Button
              variant="outline"
              onClick={() =>
                void tenantConfigurationService
                  .delete(tenantId)
                  .then(() => {
                    toast.success('Configuration removed')
                    setDraft(emptyConfigurationDraft())
                    return onReload()
                  })
                  .catch((error) => toast.error(errorMessage(error)))
              }
            >
              Delete configuration
            </Button>
          ) : null
        }
      />
      <div className="space-y-4">
        <ConfigurationFields value={draft} onChange={setDraft} assets={assets} />
        <div className="flex justify-end">
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : configuration ? 'Update configuration' : 'Create configuration'}
          </Button>
        </div>
      </div>
    </section>
  )
}
