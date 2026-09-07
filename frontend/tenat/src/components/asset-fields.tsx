import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import type { AssetDraft } from '@/lib/asset'
import { AssetType } from '@/lib/types'
import { labelize } from '@/lib/utils'

export function AssetFields({
  value,
  onChange,
  showUrl = true,
  showMeta = true,
}: {
  value: AssetDraft
  onChange: (next: AssetDraft) => void
  showUrl?: boolean
  showMeta?: boolean
}) {
  const patch = (partial: Partial<AssetDraft>) => onChange({ ...value, ...partial })

  return (
    <FieldGrid>
      <Field label="Type" required>
        <Select value={value.assetType} onValueChange={(assetType) => patch({ assetType: assetType as AssetType })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(AssetType).map((type) => (
              <SelectItem key={type} value={type}>
                {labelize(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {showUrl ? (
        <Field label="File URL" required>
          <Input value={value.fileUrl} maxLength={1000} onChange={(e) => patch({ fileUrl: e.target.value })} />
        </Field>
      ) : null}
      {showMeta ? (
        <>
          <Field label="File name">
            <Input value={value.fileName} maxLength={255} onChange={(e) => patch({ fileName: e.target.value })} />
          </Field>
          <Field label="Content type">
            <Input
              value={value.contentType}
              maxLength={100}
              placeholder="image/png"
              onChange={(e) => patch({ contentType: e.target.value })}
            />
          </Field>
        </>
      ) : null}
    </FieldGrid>
  )
}
