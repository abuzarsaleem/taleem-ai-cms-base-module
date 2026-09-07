import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AssetFields } from '@/components/asset-fields'
import { Field } from '@/components/field'
import { errorMessage } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { assetDraftFrom, assetPayload, emptyAssetDraft, validateAssetUrl } from '@/lib/asset'
import { AssetType } from '@/lib/types'
import { tenantAssetService } from '@/services/platform'
import { ResourceFormLayout } from '@/components/resource-workspace'
import { TenantAdminFrame } from '@/pages/tenant/tenant-admin-frame'

export function TenantAssetFormPage() {
  return (
    <TenantAdminFrame>
      {(tenantId) => <TenantAssetForm tenantId={tenantId} />}
    </TenantAdminFrame>
  )
}

function TenantAssetForm({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [draft, setDraft] = useState(emptyAssetDraft())
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !id) return
    tenantAssetService
      .get(tenantId, id)
      .then((row) => {
        setDraft(assetDraftFrom(row))
        setOriginalUrl(row.fileUrl)
        setMode('url')
      })
      .catch((error) => {
        toast.error(errorMessage(error))
        if (error instanceof ApiError && error.status === 404) navigate('/tenant/assets', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, tenantId])

  async function submit() {
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
        await tenantAssetService.upload(tenantId, draft.assetType, file)
        toast.success('Asset uploaded')
        navigate('/tenant/assets')
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
      if (isEdit && id) await tenantAssetService.update(tenantId, id, assetPayload(draft, originalUrl))
      else await tenantAssetService.create(tenantId, assetPayload(draft))
      toast.success(isEdit ? 'Asset updated' : 'Asset added')
      navigate('/tenant/assets')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-[var(--radius)]" />

  const uploadAccept =
    draft.assetType === AssetType.DOCUMENT ? '.pdf,application/pdf' : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'

  return (
    <ResourceFormLayout
      eyebrow="Institution"
      title={isEdit ? 'Edit asset' : 'Add asset'}
      description={
        isEdit
          ? 'Update asset metadata or the external URL.'
          : 'Register an external URL or upload a file for this institution.'
      }
      backTo="/tenant/assets"
      backLabel="Back to assets"
    >
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
