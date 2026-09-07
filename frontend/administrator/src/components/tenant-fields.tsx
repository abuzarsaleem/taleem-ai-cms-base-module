import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import { DeploymentModel } from '@/lib/types'
import type { TenantDraft } from '@/lib/tenant'

export function TenantFields({
  value,
  onChange,
  mode,
}: {
  value: TenantDraft
  onChange: (next: TenantDraft) => void
  mode: 'create' | 'update'
}) {
  const patch = (partial: Partial<TenantDraft>) => onChange({ ...value, ...partial })

  return (
    <FieldGrid>
      <Field label="Legal name" required>
        <Input
          value={value.legalName}
          maxLength={255}
          onChange={(e) => patch({ legalName: e.target.value })}
        />
      </Field>
      <Field label="Display name" required>
        <Input
          value={value.displayName}
          maxLength={255}
          onChange={(e) => patch({ displayName: e.target.value })}
        />
      </Field>
      {mode === 'create' ? (
        <Field label="Institution type" required hint="Free text, max 50. Example: UNIVERSITY.">
          <Input
            value={value.institutionType}
            maxLength={50}
            onChange={(e) => patch({ institutionType: e.target.value })}
          />
        </Field>
      ) : (
        <Field label="Institution type" hint="Set at create time and cannot be patched.">
          <Input value={value.institutionType} disabled />
        </Field>
      )}
      {mode === 'create' ? (
        <Field label="Tenant code" hint="Optional. Generated from the display name if omitted.">
          <Input
            value={value.tenantCode}
            maxLength={50}
            onChange={(e) => patch({ tenantCode: e.target.value })}
          />
        </Field>
      ) : (
        <Field label="Tenant code" hint="Set at create time and cannot be patched.">
          <Input value={value.tenantCode} disabled />
        </Field>
      )}
      <Field label="Website">
        <Input
          value={value.websiteUrl}
          maxLength={500}
          placeholder="https://university.edu"
          onChange={(e) => patch({ websiteUrl: e.target.value })}
        />
      </Field>
      {mode === 'create' ? (
        <Field label="Deployment">
          <Select
            value={value.deploymentModel}
            onValueChange={(deploymentModel) => patch({ deploymentModel: deploymentModel as DeploymentModel })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DeploymentModel.SAAS}>SaaS</SelectItem>
              <SelectItem value={DeploymentModel.ON_PREMISES}>On premises</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      ) : (
        <Field label="Deployment" hint="Set at create time and cannot be patched.">
          <Input value={value.deploymentModel.replaceAll('_', ' ')} disabled />
        </Field>
      )}
      <Field label="City">
        <Input value={value.city} maxLength={100} onChange={(e) => patch({ city: e.target.value })} />
      </Field>
      <Field label="Province">
        <Input value={value.provinceCode} maxLength={20} onChange={(e) => patch({ provinceCode: e.target.value })} />
      </Field>
      {mode === 'create' ? (
        <Field label="Country" hint="ISO 2-letter code.">
          <Input value={value.countryCode} maxLength={2} onChange={(e) => patch({ countryCode: e.target.value.toUpperCase() })} />
        </Field>
      ) : (
        <Field label="Country" hint="Set at create time and cannot be patched.">
          <Input value={value.countryCode} disabled />
        </Field>
      )}
    </FieldGrid>
  )
}
