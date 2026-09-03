import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContactFields } from '@/components/contact-fields'
import { Field, FieldGrid } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { errorMessage } from '@/lib/auth'
import { contactPayload, emptyContactDraft, validateContact } from '@/lib/contact'
import { cn } from '@/lib/utils'
import { DeploymentModel } from '@/lib/types'
import { tenantContactService, tenantService } from '@/services/platform'

const steps = ['Institution', 'Key contact', 'Review']

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function websiteOrUndefined(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function validateTenant(tenant: {
  tenantCode: string
  legalName: string
  displayName: string
  institutionType: string
  websiteUrl: string
  countryCode: string
  provinceCode: string
  city: string
}) {
  if (!tenant.legalName.trim() || !tenant.displayName.trim() || !tenant.institutionType.trim()) {
    return 'Legal name, display name, and institution type are required'
  }
  if (tenant.tenantCode.trim() && tenant.tenantCode.trim().length < 2) {
    return 'Tenant code must be at least 2 characters'
  }
  if (tenant.countryCode.trim() && tenant.countryCode.trim().length > 2) {
    return 'Country code must be 2 characters (for example PK)'
  }
  if (tenant.provinceCode.trim().length > 20) return 'Province must be 20 characters or fewer'
  if (tenant.city.trim().length > 100) return 'City must be 100 characters or fewer'
  return null
}

export function OnboardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [tenant, setTenant] = useState({
    tenantCode: '',
    legalName: '',
    displayName: '',
    institutionType: 'UNIVERSITY',
    websiteUrl: '',
    deploymentModel: DeploymentModel.SAAS,
    countryCode: 'PK',
    provinceCode: '',
    city: '',
  })
  const [contact, setContact] = useState(emptyContactDraft({ isPrimary: true }))

  const patchTenant = (partial: Partial<typeof tenant>) => setTenant((prev) => ({ ...prev, ...partial }))

  function goNext() {
    if (step === 0) {
      const tenantError = validateTenant(tenant)
      if (tenantError) {
        toast.error(tenantError)
        return
      }
    }
    if (step === 1) {
      const contactError = validateContact(contact)
      if (contactError) {
        toast.error(contactError)
        return
      }
    }
    setStep((value) => value + 1)
  }

  async function submit() {
    const tenantError = validateTenant(tenant)
    if (tenantError) {
      toast.error(tenantError)
      setStep(0)
      return
    }
    const contactError = validateContact(contact)
    if (contactError) {
      toast.error(contactError)
      setStep(1)
      return
    }
    setBusy(true)
    try {
      const created = await tenantService.create({
        tenantCode: optional(tenant.tenantCode),
        legalName: tenant.legalName.trim(),
        displayName: tenant.displayName.trim(),
        institutionType: tenant.institutionType.trim(),
        websiteUrl: websiteOrUndefined(tenant.websiteUrl),
        deploymentModel: tenant.deploymentModel,
        countryCode: optional(tenant.countryCode) ?? 'PK',
        provinceCode: optional(tenant.provinceCode),
        city: optional(tenant.city),
      })
      try {
        await tenantContactService.create(created.id, contactPayload(contact))
        toast.success(`${created.displayName} is onboarded`)
      } catch (error) {
        toast.error(`Tenant created, but key contact failed: ${errorMessage(error)}`)
      }
      navigate(`/platform/tenants/${created.id}`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Onboard institution"
        description="Create the tenant, then add the key contact. Subscriptions and invitations are managed on the tenant page."
      />
      <div className="portal-card overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                'relative shrink-0 px-3 py-3.5 text-sm font-medium transition-colors',
                index === step ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {index + 1}. {label}
              {index === step ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#00c2b2]" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">{steps[step]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 0
                ? 'POST /tenant — legal name, display name, and institution type are required.'
                : step === 1
                  ? 'POST /tenant/:id/contact — first name and contact type are required. Primary is a checkbox.'
                  : 'Confirm and create the tenant, then the key contact.'}
            </p>
          </div>

          {step === 0 ? (
            <FieldGrid>
              <Field label="Legal name" required>
                <Input value={tenant.legalName} onChange={(e) => patchTenant({ legalName: e.target.value })} />
              </Field>
              <Field label="Display name" required>
                <Input value={tenant.displayName} onChange={(e) => patchTenant({ displayName: e.target.value })} />
              </Field>
              <Field label="Institution type" required>
                <Input
                  value={tenant.institutionType}
                  onChange={(e) => patchTenant({ institutionType: e.target.value })}
                />
              </Field>
              <Field label="Tenant code" hint="Optional. Generated from the display name if omitted.">
                <Input value={tenant.tenantCode} onChange={(e) => patchTenant({ tenantCode: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={tenant.websiteUrl} onChange={(e) => patchTenant({ websiteUrl: e.target.value })} />
              </Field>
              <Field label="Deployment">
                <Select
                  value={tenant.deploymentModel}
                  onValueChange={(value) => patchTenant({ deploymentModel: value as typeof tenant.deploymentModel })}
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
              <Field label="City">
                <Input value={tenant.city} onChange={(e) => patchTenant({ city: e.target.value })} />
              </Field>
              <Field label="Province">
                <Input value={tenant.provinceCode} onChange={(e) => patchTenant({ provinceCode: e.target.value })} />
              </Field>
              <Field label="Country">
                <Input value={tenant.countryCode} onChange={(e) => patchTenant({ countryCode: e.target.value })} />
              </Field>
            </FieldGrid>
          ) : null}

          {step === 1 ? <ContactFields value={contact} onChange={setContact} /> : null}

          {step === 2 ? (
            <dl className="rounded-xl border border-border bg-background/70 px-4">
              <ReviewRow label="Institution" value={tenant.displayName} />
              <ReviewRow label="Legal name" value={tenant.legalName} />
              <ReviewRow label="Type" value={tenant.institutionType} />
              <ReviewRow label="Code" value={tenant.tenantCode || 'Generated on save'} />
              <ReviewRow label="City" value={tenant.city} />
              <ReviewRow
                label="Key contact"
                value={`${contact.firstName} ${contact.lastName}`.trim()}
              />
              <ReviewRow label="Contact type" value={contact.contactType.replaceAll('_', ' ')} />
              <ReviewRow label="Email" value={contact.email} />
              <ReviewRow label="Primary" value={contact.isPrimary ? 'Yes' : 'No'} />
              <ReviewRow label="Active" value={contact.isActive ? 'Yes' : 'No'} />
              <ReviewRow label="Mobile" value={contact.mobilePhone} />
              <ReviewRow label="WhatsApp" value={contact.whatsappNumber} />
            </dl>
          ) : null}

          <div className="flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={goNext}>Next</Button>
            ) : (
              <Button disabled={busy} onClick={() => void submit()}>
                {busy ? 'Creating…' : 'Create tenant'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[9.5rem_1fr] sm:items-baseline sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  )
}
