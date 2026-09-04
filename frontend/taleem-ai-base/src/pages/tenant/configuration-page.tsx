import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/page-header'
import { errorMessage, useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import type { Tenant, TenantAsset, TenantConfiguration, TenantSmtp } from '@/lib/types'
import {
  tenantAssetService,
  tenantConfigurationService,
  tenantService,
  tenantSmtpService,
} from '@/services/platform'
import { TenantConfigurationPanel } from '@/pages/platform/tenant-configuration-panel'
import { TenantSmtpPanel } from '@/pages/platform/tenant-smtp-panel'
import { TenantAssetsPanel } from '@/pages/platform/tenant-assets-panel'

export function TenantConfigurationPage() {
  const { session } = useAuth()
  const tenantId = session?.tenantId
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [configuration, setConfiguration] = useState<TenantConfiguration | null>(null)
  const [smtp, setSmtp] = useState<TenantSmtp | null>(null)
  const [assets, setAssets] = useState<TenantAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(!tenantId)

  const reload = useCallback(async () => {
    if (!tenantId) {
      setMissing(true)
      return
    }
    const missingOk = (error: unknown) => error instanceof ApiError && error.status === 404
    const [nextTenant, assetPage] = await Promise.all([
      tenantService.get(tenantId),
      tenantAssetService.list(tenantId),
    ])
    setTenant(nextTenant)
    setAssets(assetPage.data)
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
    setMissing(false)
  }, [tenantId])

  useEffect(() => {
    setLoading(true)
    reload()
      .catch((error) => {
        if (error instanceof ApiError && (error.status === 404 || error.status === 403)) setMissing(true)
        else toast.error(errorMessage(error))
      })
      .finally(() => setLoading(false))
  }, [reload])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      </div>
    )
  }

  if (missing || !tenant || !tenantId) {
    return (
      <EmptyState
        title="No institution assigned"
        description="This account is not an active member of a tenant. Ask a platform administrator to invite you."
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={tenant.tenantCode}
        title="Configuration"
        description="Locale, branding, outbound email, and assets for this institution."
      />
      <div className="portal-card divide-y divide-border p-5 sm:p-6">
        <TenantConfigurationPanel
          key={configuration?.updatedAt ?? 'config-new'}
          tenantId={tenant.id}
          configuration={configuration}
          assets={assets}
          onReload={reload}
        />
        <TenantSmtpPanel key={smtp?.updatedAt ?? 'smtp-new'} tenantId={tenant.id} smtp={smtp} onReload={reload} />
        <TenantAssetsPanel tenantId={tenant.id} assets={assets} onReload={reload} />
      </div>
    </div>
  )
}
