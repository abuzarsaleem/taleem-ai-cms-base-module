import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Field, FieldGrid } from '@/components/field'
import type { AddressDraft } from '@/lib/address'
import { AddressType } from '@/lib/types'
import { labelize } from '@/lib/utils'

export function AddressFields({
  value,
  onChange,
  errors = {},
}: {
  value: AddressDraft
  onChange: (next: AddressDraft) => void
  errors?: Partial<Record<keyof AddressDraft, string>>
}) {
  const patch = (partial: Partial<AddressDraft>) => onChange({ ...value, ...partial })

  return (
    <FieldGrid>
      <Field label="Type" required error={errors.addressType}>
        <SearchableSelect
          value={value.addressType}
          onValueChange={(addressType) => patch({ addressType: addressType as AddressType })}
          options={Object.values(AddressType).map((type) => ({
            value: type,
            label: labelize(type),
          }))}
          placeholder="Select address type"
        />
      </Field>
      <Field label="Address line 1" required error={errors.addressLine1}>
        <Input
          value={value.addressLine1}
          maxLength={255}
          onChange={(e) => patch({ addressLine1: e.target.value })}
        />
      </Field>
      <Field label="Address line 2" error={errors.addressLine2}>
        <Input
          value={value.addressLine2}
          maxLength={255}
          onChange={(e) => patch({ addressLine2: e.target.value })}
        />
      </Field>
      <Field label="Area" error={errors.area}>
        <Input value={value.area} maxLength={150} onChange={(e) => patch({ area: e.target.value })} />
      </Field>
      <Field label="City" required error={errors.city}>
        <Input value={value.city} maxLength={100} onChange={(e) => patch({ city: e.target.value })} />
      </Field>
      <Field label="District" error={errors.district}>
        <Input value={value.district} maxLength={100} onChange={(e) => patch({ district: e.target.value })} />
      </Field>
      <Field label="Province" error={errors.provinceCode}>
        <Input
          value={value.provinceCode}
          maxLength={20}
          onChange={(e) => patch({ provinceCode: e.target.value })}
        />
      </Field>
      <Field label="Postal code" error={errors.postalCode}>
        <Input
          value={value.postalCode}
          maxLength={20}
          onChange={(e) => patch({ postalCode: e.target.value })}
        />
      </Field>
      <Field label="Country" hint="ISO 2-letter code." error={errors.countryCode}>
        <Input
          value={value.countryCode}
          maxLength={2}
          onChange={(e) => patch({ countryCode: e.target.value.toUpperCase() })}
        />
      </Field>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={value.isPrimary} onCheckedChange={(checked) => patch({ isPrimary: checked === true })} />
          Primary address
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={value.isActive} onCheckedChange={(checked) => patch({ isActive: checked === true })} />
          Active
        </label>
      </div>
    </FieldGrid>
  )
}
