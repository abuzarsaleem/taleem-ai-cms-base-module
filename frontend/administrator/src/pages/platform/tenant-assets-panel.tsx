import { useState } from 'react'
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
import { AssetFields } from '@/components/asset-fields'
import { DataTable } from '@/components/data-table'
import { Field } from '@/components/field'
import { RowActions } from '@/components/row-actions'
import { SectionTitle } from '@/components/section-title'
import { assetDraftFrom, assetPayload, emptyAssetDraft, validateAssetUrl } from '@/lib/asset'
import { errorMessage } from '@/lib/auth'
import { labelize } from '@/lib/utils'
import { AssetType, type TenantAsset } from '@/lib/types'
import { tenantAssetService } from '@/services/platform'

export function TenantAssetsPanel({
  tenantId,
  assets,
  onReload,
}: {
  tenantId: string
  assets: TenantAsset[]
  onReload: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'url' | 'upload' | 'edit'>('url')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyAssetDraft())
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [busy, setBusy] = useState(false)

  function openCreate(nextMode: 'url' | 'upload') {
    setEditingId(null)
    setMode(nextMode)
    setDraft(emptyAssetDraft())
    setFile(null)
    setOriginalUrl('')
    setOpen(true)
  }

  async function openEdit(id: string) {
    try {
      const row = await tenantAssetService.get(tenantId, id)
      setEditingId(id)
      setMode('edit')
      setDraft(assetDraftFrom(row))
      setOriginalUrl(row.fileUrl)
      setOpen(true)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function save() {
    if (mode === 'upload') {
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
        setOpen(false)
        await onReload()
      } catch (caught) {
        toast.error(errorMessage(caught))
      } finally {
        setBusy(false)
      }
      return
    }

    const error = validateAssetUrl(draft, mode !== 'edit')
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      if (editingId) await tenantAssetService.update(tenantId, editingId, assetPayload(draft, originalUrl))
      else await tenantAssetService.create(tenantId, assetPayload(draft))
      toast.success(editingId ? 'Asset updated' : 'Asset registered')
      setOpen(false)
      await onReload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const uploadAccept = draft.assetType === AssetType.DOCUMENT ? '.pdf,application/pdf' : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'

  return (
    <section className="pt-8">
      <SectionTitle
        title="Assets"
        description="Upload a file or register an external URL. Configuration logo fields use these asset IDs."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openCreate('url')}>
              Add URL
            </Button>
            <Button onClick={() => openCreate('upload')}>Upload file</Button>
          </div>
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {mode === 'upload' ? 'Upload asset' : editingId ? 'Edit asset' : 'Register asset URL'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'upload'
                ? 'POST /tenant/:id/asset/upload — multipart assetType + file.'
                : 'assetType and fileUrl are required for URL metadata.'}
            </DialogDescription>
          </DialogHeader>
          <AssetFields value={draft} onChange={setDraft} showUrl={mode !== 'upload'} showMeta={mode !== 'upload'} />
          {mode === 'upload' ? (
            <Field
              label="File"
              required
              hint={
                draft.assetType === AssetType.DOCUMENT
                  ? 'PDF only, up to 10MB.'
                  : 'JPEG, PNG, WebP, GIF, or SVG, up to 5MB.'
              }
            >
              <Input type="file" accept={uploadAccept} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
          ) : null}
          <DialogFooter>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={['Type', 'File', 'URL', '']}
        empty="No assets yet."
        rows={assets.map((row) => [
          labelize(row.assetType),
          row.fileName ?? '—',
          <a key={row.id} href={row.fileUrl} className="text-sm underline" target="_blank" rel="noreferrer">
            Open
          </a>,
          <RowActions
            key={`${row.id}-actions`}
            onEdit={() => void openEdit(row.id)}
            onDelete={() =>
              void tenantAssetService
                .delete(tenantId, row.id)
                .then(() => {
                  toast.success('Asset removed')
                  return onReload()
                })
                .catch((error) => toast.error(errorMessage(error)))
            }
          />,
        ])}
      />
    </section>
  )
}
