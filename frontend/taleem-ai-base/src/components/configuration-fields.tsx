import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import type { ConfigurationDraft } from '@/lib/configuration'
import type { TenantAsset } from '@/lib/types'
import { AssetType } from '@/lib/types'

function AssetSelect({
  label,
  value,
  assets,
  onChange,
}: {
  label: string
  value: string
  assets: TenantAsset[]
  onChange: (value: string) => void
}) {
  return (
    <Field label={label} hint="UUID from an uploaded or registered asset of this type.">
      {assets.length ? (
        <Select value={value || '__none__'} onValueChange={(next) => onChange(next === '__none__' ? '' : next)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Not set</SelectItem>
            {assets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>
                {asset.fileName || asset.fileUrl}
              </SelectItem>
            ))}
            {value && !assets.some((asset) => asset.id === value) ? (
              <SelectItem value={value}>{value}</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      ) : (
        <Input value={value} placeholder="Asset UUID" onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  )
}

export function ConfigurationFields({
  value,
  onChange,
  assets,
}: {
  value: ConfigurationDraft
  onChange: (next: ConfigurationDraft) => void
  assets: TenantAsset[]
}) {
  const patch = (partial: Partial<ConfigurationDraft>) => onChange({ ...value, ...partial })

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
      <Field label="Primary color" hint="#RRGGBB">
        <Input value={value.primaryColor} placeholder="#1A73E8" onChange={(e) => patch({ primaryColor: e.target.value })} />
      </Field>
      <Field label="Secondary color" hint="#RRGGBB">
        <Input value={value.secondaryColor} placeholder="#FFFFFF" onChange={(e) => patch({ secondaryColor: e.target.value })} />
      </Field>
      <Field label="Accent color" hint="#RRGGBB">
        <Input value={value.accentColor} placeholder="#FF5722" onChange={(e) => patch({ accentColor: e.target.value })} />
      </Field>
      <AssetSelect
        label="Logo asset"
        value={value.logoAssetId}
        assets={assets.filter((asset) => asset.assetType === AssetType.LOGO)}
        onChange={(logoAssetId) => patch({ logoAssetId })}
      />
      <AssetSelect
        label="Dark logo asset"
        value={value.logoDarkAssetId}
        assets={assets.filter((asset) => asset.assetType === AssetType.LOGO_DARK)}
        onChange={(logoDarkAssetId) => patch({ logoDarkAssetId })}
      />
      <AssetSelect
        label="Favicon asset"
        value={value.faviconAssetId}
        assets={assets.filter((asset) => asset.assetType === AssetType.FAVICON)}
        onChange={(faviconAssetId) => patch({ faviconAssetId })}
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
