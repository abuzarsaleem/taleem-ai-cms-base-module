import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { ConfigurationFields } from '@/components/configuration-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import {
  configurationDraftFrom,
  configurationPayload,
  emptyConfigurationDraft,
  validateConfiguration,
} from '@/lib/configuration'
import type { TenantAsset } from '@/lib/types'
import { tenantAssetService, tenantConfigurationService } from '@/services/platform'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'
import { useBranding } from '@/theme/branding-provider'

export function TenantConfigurationPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantConfigurationForm tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantConfigurationForm({ tenantId }: { tenantId: string }) {
  const { apply } = useBranding()
  const [draft, setDraft] = useState(emptyConfigurationDraft())
  const [assets, setAssets] = useState<TenantAsset[]>([])
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      tenantAssetService.list(tenantId, 1, 100).catch(() => ({ data: [] as TenantAsset[] })),
      tenantConfigurationService.get(tenantId).catch((error) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }),
    ])
      .then(([assetPage, configuration]) => {
        if (cancelled) return
        setAssets(assetPage.data)
        if (configuration) {
          setDraft(configurationDraftFrom(configuration))
          setExists(true)
        } else {
          setDraft(emptyConfigurationDraft())
          setExists(false)
        }
      })
      .catch((error) => {
        if (!cancelled) toast.error(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantId])

  async function submit() {
    const error = validateConfiguration(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = configurationPayload(draft)
      const saved = exists
        ? await tenantConfigurationService.update(tenantId, body)
        : await tenantConfigurationService.create(tenantId, body)
      setExists(true)
      apply(saved)
      toast.success(exists ? 'Configuration updated' : 'Configuration created')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-[var(--radius)]" />

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Institution"
        title="Configuration"
        description="Locale, timezone, currency, and branding for this institution."
        actions={
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? 'Saving…' : exists ? 'Save configuration' : 'Add configuration'}
          </Button>
        }
      />
      <div className="portal-card space-y-5 p-5 sm:p-6">
        <ConfigurationFields
          value={draft}
          onChange={setDraft}
          assets={assets}
          tenantId={tenantId}
          onAssetUploaded={(asset) =>
            setAssets((current) => [asset, ...current.filter((row) => row.id !== asset.id)])
          }
        />
      </div>
    </div>
  )
}
