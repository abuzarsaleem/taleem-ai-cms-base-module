import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import { defaultSubscriptionEnd, type SubscriptionDraft } from '@/lib/subscription'
import { ApplicationStatus, BillingCycle, PlanType, type CatalogApplication } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SubscriptionFields({
  value,
  onChange,
  applications,
}: {
  value: SubscriptionDraft
  onChange: (next: SubscriptionDraft) => void
  applications: CatalogApplication[]
}) {
  const active = applications.filter((app) => app.status === ApplicationStatus.ACTIVE)
  const patch = (partial: Partial<SubscriptionDraft>) => onChange({ ...value, ...partial })

  return (
    <div className="space-y-5">
      <FieldGrid>
        <Field label="Plan type" required>
          <Select
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
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PlanType.TRIAL}>Trial</SelectItem>
              <SelectItem value={PlanType.FREE}>Free</SelectItem>
              <SelectItem value={PlanType.PAID}>Paid</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Billing cycle" required={value.planType === PlanType.PAID}>
          <Select
            value={value.billingCycle ?? 'NONE'}
            onValueChange={(cycle) => {
              const billingCycle = cycle === 'NONE' ? undefined : (cycle as BillingCycle)
              patch({
                billingCycle,
                endDate: defaultSubscriptionEnd(value.startDate, value.planType, billingCycle),
              })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {value.planType !== PlanType.PAID ? <SelectItem value="NONE">Not billed</SelectItem> : null}
              <SelectItem value={BillingCycle.MONTHLY}>Monthly</SelectItem>
              <SelectItem value={BillingCycle.YEARLY}>Yearly</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Start date" required>
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
        <Field label="End date" required>
          <Input type="date" value={value.endDate} onChange={(e) => patch({ endDate: e.target.value })} />
        </Field>
      </FieldGrid>
      <div className="grid gap-2">
        <p className="text-sm font-medium">
          Assign applications <span className="text-destructive">*</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Required. Selected applications are entitled for this subscription period.
        </p>
        {active.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {active.map((app) => {
              const checked = value.applicationCodes.includes(app.applicationCode)
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() =>
                    patch({
                      applicationCodes: checked
                        ? value.applicationCodes.filter((code) => code !== app.applicationCode)
                        : [...value.applicationCodes, app.applicationCode],
                    })
                  }
                  className={cn(
                    'rounded-xl border px-3 py-3 text-left transition-colors',
                    checked
                      ? 'border-[#00c2b2] bg-[#00c2b2]/10'
                      : 'border-border hover:border-[#00c2b2]/40 hover:bg-[#00c2b2]/5',
                  )}
                >
                  <span className="block text-sm font-medium">{app.name}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{app.applicationCode}</span>
                </button>
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
