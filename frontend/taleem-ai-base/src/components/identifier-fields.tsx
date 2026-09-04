import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import type { IdentifierDraft } from '@/lib/identifier'
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
}: {
  value: IdentifierDraft
  onChange: (next: IdentifierDraft) => void
  showVerified?: boolean
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

  return (
    <FieldGrid>
      <Field label="Type" required hint="Must match an active code from GET /catalog/identifier-type.">
        <Select value={value.identifierType} onValueChange={(identifierType) => patch({ identifierType })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((item) => (
              <SelectItem key={item.id} value={item.code}>
                {item.name} ({item.code})
              </SelectItem>
            ))}
            {value.identifierType && !types.some((item) => item.code === value.identifierType) ? (
              <SelectItem value={value.identifierType}>{value.identifierType}</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Value" required>
        <Input value={value.identifierValue} maxLength={150} onChange={(e) => patch({ identifierValue: e.target.value })} />
      </Field>
      <Field label="Issuing authority">
        <Input value={value.issuingAuthority} maxLength={150} onChange={(e) => patch({ issuingAuthority: e.target.value })} />
      </Field>
      <Field label="Issue date">
        <Input type="date" value={value.issueDate} onChange={(e) => patch({ issueDate: e.target.value })} />
      </Field>
      <Field label="Expiry date">
        <Input type="date" value={value.expiryDate} onChange={(e) => patch({ expiryDate: e.target.value })} />
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
