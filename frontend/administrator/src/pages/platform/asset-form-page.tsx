import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AssetFields } from '@/components/asset-fields'
import { Field } from '@/components/field'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { assetDraftFrom, assetPayload, emptyAssetDraft, validateAssetUrl } from '@/lib/asset'
import { usePlatformTenants } from '@/lib/use-platform-tenants'
import { AssetType } from '@/lib/types'
import { tenantAssetService } from '@/services/platform'
import { ResourceFormLayout, TenantPicker } from '@/pages/platform/resource-workspace'

export function PlatformAssetFormPage() {
  const navigate = useNavigate()
  const { tenantId: routeTenantId, id } = useParams()
  const [searchParams] = useSearchParams()
  const { tenants, loading: tenantsLoading } = usePlatformTenants()
  const isEdit = Boolean(routeTenantId && id)
  const [formTenantId, setFormTenantId] = useState(routeTenantId || searchParams.get('tenantId') || '')
  const [draft, setDraft] = useState(emptyAssetDraft())
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !routeTenantId || !id) return
    tenantAssetService
      .get(routeTenantId, id)
      .then((row) => {
        setFormTenantId(row.tenantId)
        setDraft(assetDraftFrom(row))
        setOriginalUrl(row.fileUrl)
        setMode('url')
      })
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/platform/assets', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, routeTenantId])

  async function submit() {
    if (!formTenantId) {
      toast.error('Select a tenant')
      return
    }
    if (!isEdit && mode === 'upload') {
      if (!file) {
        toast.error(
          draft.assetType === AssetType.DOCUMENT
            ? 'Choose a PDF to upload'
            : 'Choose a JPEG, PNG, WebP, GIF, or SVG image',
        )
        return
      }
      setBusy(true)
      try {
        await tenantAssetService.upload(formTenantId, draft.assetType, file)
        toast.success('Asset uploaded')
        navigate('/platform/assets')
      } catch (caught) {
        toast.error(errorMessage(caught))
      } finally {
        setBusy(false)
      }
      return
    }

    const error = validateAssetUrl(draft, !isEdit)
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      if (isEdit && id) await tenantAssetService.update(formTenantId, id, assetPayload(draft, originalUrl))
      else await tenantAssetService.create(formTenantId, assetPayload(draft))
      toast.success(isEdit ? 'Asset updated' : 'Asset added')
      navigate('/platform/assets')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (loading || tenantsLoading) {
    return <Skeleton className="h-96 rounded-[var(--radius)]" />
  }

  const uploadAccept =
    draft.assetType === AssetType.DOCUMENT ? '.pdf,application/pdf' : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'

  return (
    <ResourceFormLayout
      eyebrow="Tenant configuration"
      title={isEdit ? 'Edit asset' : 'Add asset'}
      description={
        isEdit
          ? 'Update asset metadata or the external URL.'
          : 'Register an external URL or upload a file for this institution.'
      }
      backTo="/platform/assets"
      backLabel="Back to assets"
    >
      <TenantPicker tenants={tenants} value={formTenantId} onChange={setFormTenantId} disabled={isEdit} />
      {!isEdit ? (
        <div className="flex gap-2">
          <Button type="button" variant={mode === 'url' ? 'default' : 'outline'} onClick={() => setMode('url')}>
            External URL
          </Button>
          <Button type="button" variant={mode === 'upload' ? 'default' : 'outline'} onClick={() => setMode('upload')}>
            Upload file
          </Button>
        </div>
      ) : null}
      <AssetFields value={draft} onChange={setDraft} showUrl={isEdit || mode === 'url'} showMeta={isEdit || mode === 'url'} />
      {!isEdit && mode === 'upload' ? (
        <Field label="File" required>
          <Input type="file" accept={uploadAccept} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </Field>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Saving…' : isEdit ? 'Save asset' : mode === 'upload' ? 'Upload asset' : 'Add asset'}
        </Button>
      </div>
    </ResourceFormLayout>
  )
}
