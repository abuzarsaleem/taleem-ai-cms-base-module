import { BillingCycle, PlanType, SubscriptionStatus, type Subscription } from '@/lib/types'

export type SubscriptionAppDraft = {
  applicationCode: string
  launchUrl: string
  maxUsers: string
}

export type SubscriptionDraft = {
  tenantId: string
  planType: PlanType
  billingCycle?: BillingCycle
  startDate: string
  endDate: string
  applications: SubscriptionAppDraft[]
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function defaultSubscriptionEnd(
  startDate: string,
  planType: PlanType,
  billingCycle?: BillingCycle,
) {
  const date = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return startDate
  if (planType === PlanType.TRIAL) date.setDate(date.getDate() + 30)
  else if (planType === PlanType.PAID && billingCycle === BillingCycle.MONTHLY) date.setMonth(date.getMonth() + 1)
  else date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

export function emptySubscriptionDraft(tenantId = ''): SubscriptionDraft {
  const startDate = todayIso()
  return {
    tenantId,
    planType: PlanType.TRIAL,
    billingCycle: BillingCycle.MONTHLY,
    startDate,
    endDate: defaultSubscriptionEnd(startDate, PlanType.TRIAL, BillingCycle.MONTHLY),
    applications: [],
  }
}

export function subscriptionDraftFrom(row: Subscription, tenantId = row.tenantId): SubscriptionDraft {
  return {
    tenantId,
    planType: row.planType,
    billingCycle: row.billingCycle,
    startDate: row.startDate.slice(0, 10),
    endDate: row.endDate.slice(0, 10),
    applications: row.applicationCodes.map((applicationCode) => ({
      applicationCode,
      launchUrl: '',
      maxUsers: '',
    })),
  }
}

export function subscriptionPeriodEnded(endDate: string, at = todayIso()) {
  return Boolean(endDate) && endDate.slice(0, 10) < at
}

export function subscriptionIsInForce(row: Subscription) {
  return (
    row.status === SubscriptionStatus.ACTIVE &&
    row.applicationCodes.length > 0 &&
    !subscriptionPeriodEnded(row.endDate)
  )
}

export function subscriptionDisplayStatus(row: Subscription) {
  if (subscriptionPeriodEnded(row.endDate)) return 'EXPIRED'
  if (row.status === SubscriptionStatus.INACTIVE) return 'SUSPENDED'
  return 'ACTIVE'
}

export function subscriptionDurationLabel(startDate: string, endDate: string) {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`)
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '—'
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (months <= 0) {
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
    return `${days} day${days === 1 ? '' : 's'}`
  }
  return `${months} month${months === 1 ? '' : 's'}`
}

export function subscriptionFieldErrors(draft: SubscriptionDraft) {
  const errors: Partial<Record<'tenantId' | 'planType' | 'billingCycle' | 'startDate' | 'endDate' | 'applications', string>> = {}
  if (!draft.tenantId) errors.tenantId = 'Select a tenant'
  if (!draft.planType) errors.planType = 'Plan type is required'
  else if (!Object.values(PlanType).includes(draft.planType)) errors.planType = 'Plan type is invalid'
  if (draft.planType === PlanType.PAID && !draft.billingCycle) {
    errors.billingCycle = 'Billing cycle is required for paid plans'
  }
  if (draft.billingCycle && !Object.values(BillingCycle).includes(draft.billingCycle)) {
    errors.billingCycle = 'Billing cycle is invalid'
  }
  if (!draft.startDate) errors.startDate = 'Start date is required'
  if (!draft.endDate) errors.endDate = 'End date is required'
  else if (draft.startDate && draft.endDate < draft.startDate) {
    errors.endDate = 'End date must be on or after start date'
  }
  if (!draft.applications.length) errors.applications = 'Assign at least one application'
  return errors
}

export function validateSubscription(draft: SubscriptionDraft) {
  return Object.values(subscriptionFieldErrors(draft))[0] ?? null
}

export function createSubscriptionPayload(draft: SubscriptionDraft) {
  return {
    startDate: draft.startDate,
    endDate: draft.endDate,
    planType: draft.planType,
    billingCycle: draft.billingCycle,
    applications: draft.applications.map((app) => ({
      applicationCode: app.applicationCode,
      launchUrl: app.launchUrl.trim() || undefined,
      maxUsers: app.maxUsers.trim() ? Number(app.maxUsers) : undefined,
    })),
  }
}

export function updateSubscriptionPayload(draft: SubscriptionDraft) {
  return createSubscriptionPayload(draft)
}
