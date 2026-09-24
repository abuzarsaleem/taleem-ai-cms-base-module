import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Field, FieldGrid } from '@/components/field'
import type { ContactDraft } from '@/lib/contact'
import { ContactType } from '@/lib/types'
import { catalogService, type CatalogItem } from '@/services/platform'

function labelize(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function CatalogOrInput({
  label,
  value,
  items,
  error,
  onChange,
}: {
  label: string
  value: string
  items: CatalogItem[]
  error?: string
  onChange: (value: string) => void
}) {
  if (!items.length) {
    return (
      <Field label={label} error={error}>
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </Field>
    )
  }
  const options = [
    { value: '__none__', label: 'Not set' },
    ...items.map((item) => ({ value: item.name, label: item.name })),
    ...(value && !items.some((item) => item.name === value) ? [{ value, label: value }] : []),
  ]
  return (
    <Field label={label} error={error}>
      <SearchableSelect
        value={value || '__none__'}
        onValueChange={(next) => onChange(next === '__none__' ? '' : next)}
        options={options}
        placeholder={`Select ${label.toLowerCase()}`}
      />
    </Field>
  )
}

export function ContactFields({
  value,
  onChange,
  errors = {},
}: {
  value: ContactDraft
  onChange: (next: ContactDraft) => void
  errors?: Partial<Record<keyof ContactDraft, string>>
}) {
  const [departments, setDepartments] = useState<CatalogItem[]>([])
  const [designations, setDesignations] = useState<CatalogItem[]>([])

  useEffect(() => {
    void Promise.all([catalogService.departments(), catalogService.designations()])
      .then(([nextDepartments, nextDesignations]) => {
        setDepartments((Array.isArray(nextDepartments) ? nextDepartments : []).filter((item) => item.isActive !== false))
        setDesignations((Array.isArray(nextDesignations) ? nextDesignations : []).filter((item) => item.isActive !== false))
      })
      .catch(() => {
        setDepartments([])
        setDesignations([])
      })
  }, [])

  const patch = (partial: Partial<ContactDraft>) => onChange({ ...value, ...partial })

  return (
    <FieldGrid>
      <Field label="First name" required error={errors.firstName}>
        <Input value={value.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
      </Field>
      <Field label="Middle name" error={errors.middleName}>
        <Input value={value.middleName} onChange={(e) => patch({ middleName: e.target.value })} />
      </Field>
      <Field label="Last name" error={errors.lastName}>
        <Input value={value.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
      </Field>
      <Field label="Type" required error={errors.contactType}>
        <SearchableSelect
          value={value.contactType}
          onValueChange={(next) => patch({ contactType: next as ContactType })}
          options={Object.values(ContactType).map((type) => ({
            value: type,
            label: labelize(type),
          }))}
          placeholder="Select contact type"
        />
      </Field>
      <CatalogOrInput
        label="Designation"
        value={value.designation}
        items={designations}
        error={errors.designation}
        onChange={(designation) => patch({ designation })}
      />
      <CatalogOrInput
        label="Department"
        value={value.department}
        items={departments}
        error={errors.department}
        onChange={(department) => patch({ department })}
      />
      <Field label="Email" required error={errors.email}>
        <Input
          type="email"
          autoComplete="email"
          maxLength={255}
          value={value.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
      </Field>
      <Field label="Mobile phone" error={errors.mobilePhone}>
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          value={value.mobilePhone}
          onChange={(e) => patch({ mobilePhone: e.target.value })}
        />
      </Field>
      <Field label="Landline" error={errors.landlinePhone}>
        <Input
          type="tel"
          inputMode="tel"
          maxLength={30}
          value={value.landlinePhone}
          onChange={(e) => patch({ landlinePhone: e.target.value })}
        />
      </Field>
      <Field label="WhatsApp" error={errors.whatsappNumber}>
        <Input
          type="tel"
          inputMode="tel"
          maxLength={30}
          value={value.whatsappNumber}
          onChange={(e) => patch({ whatsappNumber: e.target.value })}
        />
      </Field>
      <Field label="Responsibility" className="sm:col-span-2" error={errors.responsibility}>
        <Input value={value.responsibility} onChange={(e) => patch({ responsibility: e.target.value })} />
      </Field>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.isPrimary}
            onCheckedChange={(checked) => patch({ isPrimary: checked === true })}
          />
          Primary contact
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.isActive}
            onCheckedChange={(checked) => patch({ isActive: checked === true })}
          />
          Active
        </label>
      </div>
    </FieldGrid>
  )
}
