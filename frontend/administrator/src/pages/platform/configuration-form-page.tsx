import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigurationFields } from '@/components/configuration-fields'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import {
  configurationDraftFrom,
  configurationPayload,
  emptyConfigurationDraft,
  validateConfiguration,
} from '@/lib/configuration'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import type { TenantAsset } from '@/lib/types'
import { tenantAssetService, tenantConfigurationService } from '@/services/platform'
import { ResourceFormLayout, TenantPicker } from '@/pages/platform/resource-workspace'

export function PlatformConfigurationFormPage() {
  const navigate = useNavigate()
  const { tenantId: routeTenantId } = useParams()
  const [searchParams] = useSearchParams()
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const isEdit = Boolean(routeTenantId)
  const [formTenantId, setFormTenantId] = useState(routeTenantId || searchParams.get('tenantId') || '')
  const [draft, setDraft] = useState(emptyConfigurationDraft())
  const [assets, setAssets] = useState<TenantAsset[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)
  const [exists, setExists] = useState(isEdit)

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
    if (!isEdit || !routeTenantId) return
    tenantConfigurationService
      .get(routeTenantId)
      .then((row) => {
        setFormTenantId(row.tenantId)
        setDraft(configurationDraftFrom(row))
        setExists(true)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setExists(false)
          setDraft(emptyConfigurationDraft())
          return
        }
        toast.error(errorMessage(error))
        navigate('/platform/configuration', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [isEdit, navigate, routeTenantId])

  async function submit() {
    if (!formTenantId) {
      toast.error('Select a tenant')
      return
    }
    const error = validateConfiguration(draft)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const body = configurationPayload(draft)
      if (exists) await tenantConfigurationService.update(formTenantId, body)
      else await tenantConfigurationService.create(formTenantId, body)
      toast.success(exists ? 'Configuration updated' : 'Configuration created')
      navigate('/platform/configuration')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (loading || tenantsLoading) {
    return <Skeleton className="h-96 rounded-[var(--radius)]" />
  }

  return (
    <ResourceFormLayout
      eyebrow="Tenant configuration"
      title={exists ? 'Edit configuration' : 'Add configuration'}
      description="One configuration record per tenant. Locale, timezone, currency, and branding."
      backTo="/platform/configuration"
      backLabel="Back to configuration"
    >
      <TenantPicker tenants={tenants} value={formTenantId} onChange={setFormTenantId} disabled={isEdit} />
      <ConfigurationFields
        value={draft}
        onChange={setDraft}
        assets={assets}
        tenantId={formTenantId}
        onAssetUploaded={(asset) =>
          setAssets((current) => [asset, ...current.filter((row) => row.id !== asset.id)])
        }
      />
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : exists ? 'Save configuration' : 'Add configuration'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
