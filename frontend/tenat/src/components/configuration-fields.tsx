import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorInput } from '@/components/color-input'
import { Field, FieldGrid } from '@/components/field'
import { errorMessage } from '@/lib/auth'
import type { ConfigurationDraft } from '@/lib/configuration'
import { isDisplayableImageUrl } from '@/lib/utils'
import type { TenantAsset } from '@/lib/types'
import { AssetType } from '@/lib/types'
import { tenantAssetService } from '@/services/platform'

function BrandingAssetField({
  label,
  assetType,
  value,
  assets,
  tenantId,
  onChange,
  onUploaded,
}: {
  label: string
  assetType: AssetType
  value: string
  assets: TenantAsset[]
  tenantId?: string
  onChange: (value: string) => void
  onUploaded: (asset: TenantAsset) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const current = assets.find((asset) => asset.id === value)
  const previewUrl = localPreview || current?.fileUrl

  async function upload(file?: File) {
    if (!file) return
    if (!tenantId) {
      toast.error('Select a tenant first')
      return
    }
    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    setBusy(true)
    try {
      const uploaded = await tenantAssetService.upload(tenantId, assetType, file)
      onUploaded(uploaded)
      onChange(uploaded.id)
      toast.success(`${label} uploaded`)
      if (isDisplayableImageUrl(uploaded.fileUrl)) {
        URL.revokeObjectURL(preview)
        setLocalPreview(null)
      }
    } catch (error) {
      URL.revokeObjectURL(preview)
      setLocalPreview(null)
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Field label={label} hint="Upload an image. The asset id is attached automatically when you save.">
      <div className="flex flex-col gap-3">
        {isDisplayableImageUrl(previewUrl) ? (
          <img src={previewUrl} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !tenantId}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </Button>
          {value || localPreview ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (localPreview) URL.revokeObjectURL(localPreview)
                setLocalPreview(null)
                onChange('')
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </Field>
  )
}

export function ConfigurationFields({
  value,
  onChange,
  assets,
  tenantId,
  onAssetUploaded,
}: {
  value: ConfigurationDraft
  onChange: (next: ConfigurationDraft) => void
  assets: TenantAsset[]
  tenantId?: string
  onAssetUploaded?: (asset: TenantAsset) => void
}) {
  const patch = (partial: Partial<ConfigurationDraft>) => onChange({ ...value, ...partial })
  const remember = (asset: TenantAsset) => onAssetUploaded?.(asset)

  return (
    <FieldGrid>
      <Field label="Timezone">
        <Input value={value.timezone} maxLength={100} onChange={(e) => patch({ timezone: e.target.value })} />
      </Field>
      <Field label="Locale">
        <Input value={value.locale} maxLength={20} onChange={(e) => patch({ locale: e.target.value })} />
      </Field>
      <Field label="Date format">
        <Input value={value.dateFormat} maxLength={30} onChange={(e) => patch({ dateFormat: e.target.value })} />
      </Field>
      <Field label="Currency">
        <Input value={value.currencyCode} maxLength={3} onChange={(e) => patch({ currencyCode: e.target.value.toUpperCase() })} />
      </Field>
      <Field label="Branding name">
        <Input value={value.brandingName} maxLength={255} onChange={(e) => patch({ brandingName: e.target.value })} />
      </Field>
      <Field label="Font family">
        <Input value={value.fontFamily} onChange={(e) => patch({ fontFamily: e.target.value })} />
      </Field>
      <Field label="Primary color">
        <ColorInput value={value.primaryColor} placeholder="#1A73E8" onChange={(primaryColor) => patch({ primaryColor })} />
      </Field>
      <Field label="Secondary color">
        <ColorInput value={value.secondaryColor} placeholder="#FFFFFF" onChange={(secondaryColor) => patch({ secondaryColor })} />
      </Field>
      <Field label="Accent color">
        <ColorInput value={value.accentColor} placeholder="#FF5722" onChange={(accentColor) => patch({ accentColor })} />
      </Field>
      <BrandingAssetField
        label="Logo"
        assetType={AssetType.LOGO}
        value={value.logoAssetId}
        assets={assets}
        tenantId={tenantId}
        onChange={(logoAssetId) => patch({ logoAssetId })}
        onUploaded={remember}
      />
      <BrandingAssetField
        label="Dark logo"
        assetType={AssetType.LOGO_DARK}
        value={value.logoDarkAssetId}
        assets={assets}
        tenantId={tenantId}
        onChange={(logoDarkAssetId) => patch({ logoDarkAssetId })}
        onUploaded={remember}
      />
      <BrandingAssetField
        label="Favicon"
        assetType={AssetType.FAVICON}
        value={value.faviconAssetId}
        assets={assets}
        tenantId={tenantId}
        onChange={(faviconAssetId) => patch({ faviconAssetId })}
        onUploaded={remember}
      />
      <Field label="Email from name">
        <Input value={value.emailFromName} onChange={(e) => patch({ emailFromName: e.target.value })} />
      </Field>
      <Field label="Email from address">
        <Input type="email" value={value.emailFromAddress} onChange={(e) => patch({ emailFromAddress: e.target.value })} />
      </Field>
      <Field label="Support email">
        <Input type="email" value={value.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} />
      </Field>
    </FieldGrid>
  )
}
