import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Field, FieldGrid } from '@/components/field'
import {
  COUNTRY_OPTIONS,
  cityOptionsForProvince,
  provinceOptionsForCountry,
} from '@/data/pakistan-locations'
import { DeploymentModel } from '@/lib/types'
import type { TenantDraft } from '@/lib/tenant'

const INSTITUTION_TYPES = [
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'INSTITUTE', label: 'Institute' },
  { value: 'ACADEMY', label: 'Academy' },
  { value: 'OTHER', label: 'Other' },
]

export function TenantFields({
  value,
  onChange,
  mode,
  errors = {},
}: {
  value: TenantDraft
  onChange: (next: TenantDraft) => void
  mode: 'create' | 'update'
  errors?: Partial<Record<keyof TenantDraft, string>>
}) {
  const patch = (partial: Partial<TenantDraft>) => onChange({ ...value, ...partial })
  const provinceOptions = provinceOptionsForCountry(value.countryCode)
  const cityOptions = cityOptionsForProvince(value.countryCode, value.provinceCode)

  return (
    <FieldGrid>
      <Field label="Legal name" required error={errors.legalName}>
        <Input
          value={value.legalName}
          maxLength={255}
          onChange={(e) => patch({ legalName: e.target.value })}
        />
      </Field>
      <Field label="Display name" required error={errors.displayName}>
        <Input
          value={value.displayName}
          maxLength={255}
          onChange={(e) => patch({ displayName: e.target.value })}
        />
      </Field>
      {mode === 'create' ? (
        <Field label="Institution type" required error={errors.institutionType}>
          <SearchableSelect
            value={value.institutionType}
            onValueChange={(institutionType) => patch({ institutionType })}
            options={INSTITUTION_TYPES}
            placeholder="Select type"
          />
        </Field>
      ) : (
        <Field label="Institution type" hint="Set at create time and cannot be patched.">
          <Input value={value.institutionType} disabled />
        </Field>
      )}
      {mode === 'update' ? (
        <Field label="Tenant code" hint="Generated when the tenant is created.">
          <Input value={value.tenantCode} disabled />
        </Field>
      ) : null}
      <Field label="Website" error={errors.websiteUrl}>
        <Input
          value={value.websiteUrl}
          maxLength={500}
          placeholder="https://university.edu"
          onChange={(e) => patch({ websiteUrl: e.target.value })}
        />
      </Field>
      {mode === 'create' ? (
        <Field label="Deployment" required>
          <SearchableSelect
            value={value.deploymentModel}
            onValueChange={(deploymentModel) => patch({ deploymentModel: deploymentModel as DeploymentModel })}
            options={[
              { value: DeploymentModel.SAAS, label: 'SaaS' },
              { value: DeploymentModel.ON_PREMISES, label: 'On premises' },
            ]}
            placeholder="Select deployment"
          />
        </Field>
      ) : (
        <Field label="Deployment" hint="Set at create time and cannot be patched.">
          <Input value={value.deploymentModel.replaceAll('_', ' ')} disabled />
        </Field>
      )}
      <Field label="Country" required={mode === 'create'} error={errors.countryCode}>
        {mode === 'create' ? (
          <SearchableSelect
            value={value.countryCode}
            onValueChange={(countryCode) =>
              patch({
                countryCode,
                provinceCode: '',
                city: '',
              })
            }
            options={COUNTRY_OPTIONS}
            placeholder="Select country"
            searchPlaceholder="Search countries..."
            aria-invalid={Boolean(errors.countryCode)}
          />
        ) : (
          <Input
            value={COUNTRY_OPTIONS.find((row) => row.value === value.countryCode)?.label ?? value.countryCode}
            disabled
          />
        )}
      </Field>
      <Field label="Province / State" error={errors.provinceCode}>
        <SearchableSelect
          value={value.provinceCode}
          onValueChange={(provinceCode) =>
            patch({
              provinceCode,
              city: '',
            })
          }
          options={provinceOptions}
          placeholder={value.countryCode ? 'Select province' : 'Select country first'}
          searchPlaceholder="Search provinces..."
          disabled={!value.countryCode || provinceOptions.length === 0}
          emptyMessage="No provinces for this country"
          aria-invalid={Boolean(errors.provinceCode)}
        />
      </Field>
      <Field label="City" error={errors.city}>
        <SearchableSelect
          value={value.city}
          onValueChange={(city) => patch({ city })}
          options={cityOptions}
          placeholder={value.provinceCode ? 'Select city' : 'Select province first'}
          searchPlaceholder="Search cities..."
          disabled={!value.provinceCode || cityOptions.length === 0}
          emptyMessage="No cities for this province"
          aria-invalid={Boolean(errors.city)}
        />
      </Field>
    </FieldGrid>
  )
}
