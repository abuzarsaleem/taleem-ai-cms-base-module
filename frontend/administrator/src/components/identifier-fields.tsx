import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Field, FieldGrid } from '@/components/field'
import { maxIssueDate, minExpiryDate, type IdentifierDraft } from '@/lib/identifier'
import { IdentifierType } from '@/lib/types'
import { catalogService, type CatalogItem } from '@/services/platform'

const FALLBACK_TYPES: CatalogItem[] = Object.values(IdentifierType).map((code) => ({
  id: code,
  code,
  name: code.replaceAll('_', ' '),
  isActive: true,
}))

export function IdentifierFields({
  value,
  onChange,
  showVerified = false,
  errors = {},
}: {
  value: IdentifierDraft
  onChange: (next: IdentifierDraft) => void
  showVerified?: boolean
  errors?: Partial<Record<keyof IdentifierDraft, string>>
}) {
  const [types, setTypes] = useState<CatalogItem[]>(FALLBACK_TYPES)
  const patch = (partial: Partial<IdentifierDraft>) => onChange({ ...value, ...partial })

  useEffect(() => {
    void catalogService
      .identifierTypes()
      .then((items) => {
        const active = (Array.isArray(items) ? items : []).filter((item) => item.isActive !== false)
        if (active.length) setTypes(active)
      })
      .catch(() => setTypes(FALLBACK_TYPES))
  }, [])

  const typeOptions = [
    ...types.map((item) => ({
      value: item.code,
      label: `${item.name} (${item.code})`,
    })),
    ...(value.identifierType && !types.some((item) => item.code === value.identifierType)
      ? [{ value: value.identifierType, label: value.identifierType }]
      : []),
  ]

  return (
    <FieldGrid>
      <Field label="Type" required error={errors.identifierType}>
        <SearchableSelect
          value={value.identifierType}
          onValueChange={(identifierType) => patch({ identifierType })}
          options={typeOptions}
          placeholder="Select identifier type"
        />
      </Field>
      <Field label="Value" required error={errors.identifierValue}>
        <Input value={value.identifierValue} maxLength={150} onChange={(e) => patch({ identifierValue: e.target.value })} />
      </Field>
      <Field label="Issuing authority" error={errors.issuingAuthority}>
        <Input value={value.issuingAuthority} maxLength={150} onChange={(e) => patch({ issuingAuthority: e.target.value })} />
      </Field>
      <Field label="Issue date" error={errors.issueDate}>
        <Input
          type="date"
          value={value.issueDate}
          max={maxIssueDate(value.expiryDate)}
          onChange={(e) => patch({ issueDate: e.target.value })}
        />
      </Field>
      <Field label="Expiry date" error={errors.expiryDate}>
        <Input
          type="date"
          value={value.expiryDate}
          min={minExpiryDate(value.issueDate)}
          onChange={(e) => patch({ expiryDate: e.target.value })}
        />
      </Field>
      {showVerified ? (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox checked={value.isVerified} onCheckedChange={(checked) => patch({ isVerified: checked === true })} />
          Verified
        </label>
      ) : null}
    </FieldGrid>
  )
}
