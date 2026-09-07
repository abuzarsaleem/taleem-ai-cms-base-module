import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SectionTitle } from '@/components/section-title'
import { StatusBadge } from '@/components/status-badge'
import { errorMessage } from '@/lib/auth'
import { subscriptionIsInForce } from '@/lib/subscription'
import {
  ApplicationStatus,
  EntitlementStatus,
  type CatalogApplication,
  type Entitlement,
  type Subscription,
} from '@/lib/types'
import { entitlementService } from '@/services/platform'

export function TenantEntitlementsPanel({
  tenantId,
  applications,
  entitlements,
  subscriptions,
  onReload,
}: {
  tenantId: string
  applications: CatalogApplication[]
  entitlements: Entitlement[]
  subscriptions: Subscription[]
  onReload: () => Promise<void>
}) {
  function matchingSubscription(applicationCode: string) {
    return subscriptions.find(
      (row) => subscriptionIsInForce(row) && row.applicationCodes.includes(applicationCode),
    )
  }

  async function grant(applicationCode: string) {
    const subscription = matchingSubscription(applicationCode)
    if (!subscription) {
      toast.error('Include this application on an in-force subscription first')
      return
    }
    try {
      await entitlementService.create(tenantId, {
        applicationCode,
        subscriptionId: subscription.id,
      })
      toast.success(`${applicationCode} entitled`)
      await onReload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function setInactive(entitlementId: string, name: string) {
    try {
      await entitlementService.update(tenantId, entitlementId, { status: EntitlementStatus.INACTIVE })
      toast.success(`${name} set inactive`)
      await onReload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div>
      <SectionTitle
        title="Application entitlements"
        description="Creating a subscription entitles its applications. Grant here only for apps already on an in-force subscription."
      />
      {applications.length ? (
        <ul className="space-y-2">
          {applications.map((app) => {
            const entitlement = entitlements.find(
              (row) => row.applicationId === app.id || row.applicationCode === app.applicationCode,
            )
            const active = entitlement?.status === EntitlementStatus.ACTIVE
            const covered = Boolean(matchingSubscription(app.applicationCode))
            const catalogueActive = app.status === ApplicationStatus.ACTIVE
            return (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/70 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="font-medium">{app.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{app.applicationCode}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={entitlement?.status ?? 'NOT_ENTITLED'} />
                  {active ? (
                    <Button size="sm" variant="outline" onClick={() => void setInactive(entitlement.id, app.name)}>
                      Inactive
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!catalogueActive || !covered}
                      onClick={() => void grant(app.applicationCode)}
                    >
                      Grant
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Register applications in the catalogue first.
        </div>
      )}
    </div>
  )
}
