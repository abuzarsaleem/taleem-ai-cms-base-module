import { ApplicationIcon } from '@/components/application-icon'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Field, FieldGrid } from '@/components/field'
import { defaultSubscriptionEnd, type SubscriptionDraft } from '@/lib/subscription'
import { ApplicationStatus, BillingCycle, PlanType, type CatalogApplication } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SubscriptionFields({
  value,
  onChange,
  applications,
  errors = {},
  showTenantPicker,
  tenantOptions,
}: {
  value: SubscriptionDraft
  onChange: (next: SubscriptionDraft) => void
  applications: CatalogApplication[]
  errors?: Partial<Record<'tenantId' | 'planType' | 'billingCycle' | 'startDate' | 'endDate' | 'applications', string>>
  showTenantPicker?: boolean
  tenantOptions?: Array<{ value: string; label: string; description?: string }>
}) {
  const active = applications.filter((app) => app.status === ApplicationStatus.ACTIVE)
  const patch = (partial: Partial<SubscriptionDraft>) => onChange({ ...value, ...partial })
  const selectedCodes = new Set(value.applications.map((app) => app.applicationCode))

  return (
    <div className="space-y-5">
      <FieldGrid>
        {showTenantPicker ? (
          <Field label="Tenant" required className="sm:col-span-2" error={errors.tenantId}>
            <SearchableSelect
              value={value.tenantId || '__none__'}
              onValueChange={(tenantId) => patch({ tenantId: tenantId === '__none__' ? '' : tenantId })}
              options={[
                { value: '__none__', label: 'Select tenant' },
                ...(tenantOptions ?? []),
              ]}
              placeholder="Select tenant"
            />
          </Field>
        ) : null}
        <Field label="Plan type" required error={errors.planType}>
          <SearchableSelect
            value={value.planType}
            onValueChange={(planType) => {
              const nextType = planType as PlanType
              const billingCycle =
                nextType === PlanType.PAID ? (value.billingCycle ?? BillingCycle.YEARLY) : value.billingCycle
              patch({
                planType: nextType,
                billingCycle,
                endDate: defaultSubscriptionEnd(value.startDate, nextType, billingCycle),
              })
            }}
            options={[
              { value: PlanType.TRIAL, label: 'Trial' },
              { value: PlanType.FREE, label: 'Free' },
              { value: PlanType.PAID, label: 'Paid' },
            ]}
            placeholder="Select plan type"
          />
        </Field>
        <Field label="Billing cycle" required={value.planType === PlanType.PAID} error={errors.billingCycle}>
          <SearchableSelect
            value={value.billingCycle ?? 'NONE'}
            onValueChange={(cycle) => {
              const billingCycle = cycle === 'NONE' ? undefined : (cycle as BillingCycle)
              patch({
                billingCycle,
                endDate: defaultSubscriptionEnd(value.startDate, value.planType, billingCycle),
              })
            }}
            options={[
              ...(value.planType !== PlanType.PAID ? [{ value: 'NONE', label: 'Not billed' }] : []),
              { value: BillingCycle.MONTHLY, label: 'Monthly' },
              { value: BillingCycle.YEARLY, label: 'Yearly' },
            ]}
            placeholder="Select billing cycle"
          />
        </Field>
        <Field label="Start date" required error={errors.startDate}>
          <Input
            type="date"
            value={value.startDate}
            onChange={(e) =>
              patch({
                startDate: e.target.value,
                endDate: defaultSubscriptionEnd(e.target.value, value.planType, value.billingCycle),
              })
            }
          />
        </Field>
        <Field label="End date" required error={errors.endDate}>
          <Input type="date" value={value.endDate} onChange={(e) => patch({ endDate: e.target.value })} />
        </Field>
      </FieldGrid>

      <div className="grid gap-2">
        <p className="text-sm font-medium">
          Assign applications <span className="text-destructive">*</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Required. Selected applications are entitled for this subscription period. Optionally set launch URL and max users.
        </p>
        {errors.applications ? <p className="text-xs text-destructive">{errors.applications}</p> : null}
        {active.length ? (
          <div className="grid gap-3">
            {active.map((app) => {
              const checked = selectedCodes.has(app.applicationCode)
              const current = value.applications.find((item) => item.applicationCode === app.applicationCode)
              return (
                <div
                  key={app.id}
                  className={cn(
                    'rounded-xl border px-3 py-3 transition-colors',
                    checked ? 'border-[#00c2b2] bg-[#00c2b2]/10' : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() =>
                      patch({
                        applications: checked
                          ? value.applications.filter((item) => item.applicationCode !== app.applicationCode)
                          : [
                              ...value.applications,
                              {
                                applicationCode: app.applicationCode,
                                launchUrl: app.launchUrl ?? '',
                                maxUsers: '',
                              },
                            ],
                      })
                    }
                  >
                    <ApplicationIcon code={app.applicationCode} logoUrl={app.logoUrl} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{app.name}</span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                        {app.applicationCode}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{checked ? 'Selected' : 'Select'}</span>
                  </button>
                  {checked ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2" onClick={(event) => event.stopPropagation()}>
                      <Field label="Launch URL">
                        <Input
                          value={current?.launchUrl ?? ''}
                          placeholder="https://app.example.edu"
                          onChange={(e) =>
                            patch({
                              applications: value.applications.map((item) =>
                                item.applicationCode === app.applicationCode
                                  ? { ...item, launchUrl: e.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </Field>
                      <Field label="Max users">
                        <Input
                          type="number"
                          min={1}
                          value={current?.maxUsers ?? ''}
                          placeholder="Unlimited"
                          onChange={(e) =>
                            patch({
                              applications: value.applications.map((item) =>
                                item.applicationCode === app.applicationCode
                                  ? { ...item, maxUsers: e.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </Field>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
            No active applications in the catalogue yet.
          </p>
        )}
      </div>
    </div>
  )
}
