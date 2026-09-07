import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import { type ContactDraft } from '@/lib/contact'
import { ContactType } from '@/lib/types'
import { catalogService, type CatalogItem } from '@/services/platform'

function labelize(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function CatalogOrInput({
  label,
  value,
  items,
  onChange,
}: {
  label: string
  value: string
  items: CatalogItem[]
  onChange: (value: string) => void
}) {
  if (!items.length) {
    return (
      <Field label={label}>
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </Field>
    )
  }
  return (
    <Field label={label}>
      <Select value={value || '__none__'} onValueChange={(next) => onChange(next === '__none__' ? '' : next)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Not set</SelectItem>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.name}>
              {item.name}
            </SelectItem>
          ))}
          {value && !items.some((item) => item.name === value) ? (
            <SelectItem value={value}>{value}</SelectItem>
          ) : null}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function ContactFields({
  value,
  onChange,
}: {
  value: ContactDraft
  onChange: (next: ContactDraft) => void
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
      <Field label="First name" required>
        <Input value={value.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
      </Field>
      <Field label="Middle name">
        <Input value={value.middleName} onChange={(e) => patch({ middleName: e.target.value })} />
      </Field>
      <Field label="Last name">
        <Input value={value.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
      </Field>
      <Field label="Type" required>
        <Select value={value.contactType} onValueChange={(next) => patch({ contactType: next as ContactType })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ContactType).map((type) => (
              <SelectItem key={type} value={type}>
                {labelize(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <CatalogOrInput
        label="Designation"
        value={value.designation}
        items={designations}
        onChange={(designation) => patch({ designation })}
      />
      <CatalogOrInput
        label="Department"
        value={value.department}
        items={departments}
        onChange={(department) => patch({ department })}
      />
      <Field label="Email">
        <Input type="email" value={value.email} onChange={(e) => patch({ email: e.target.value })} />
      </Field>
      <Field label="Mobile phone">
        <Input value={value.mobilePhone} onChange={(e) => patch({ mobilePhone: e.target.value })} />
      </Field>
      <Field label="Landline">
        <Input value={value.landlinePhone} onChange={(e) => patch({ landlinePhone: e.target.value })} />
      </Field>
      <Field label="WhatsApp">
        <Input value={value.whatsappNumber} onChange={(e) => patch({ whatsappNumber: e.target.value })} />
      </Field>
      <Field label="Responsibility" className="sm:col-span-2">
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
