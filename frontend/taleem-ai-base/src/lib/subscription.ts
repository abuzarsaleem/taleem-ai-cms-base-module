import { BillingCycle, PlanType, SubscriptionStatus, type Subscription } from '@/lib/types'

export type SubscriptionDraft = {
  planType: PlanType
  billingCycle?: BillingCycle
  startDate: string
  endDate: string
  applicationCodes: string[]
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

export function emptySubscriptionDraft(): SubscriptionDraft {
  const startDate = todayIso()
  return {
    planType: PlanType.TRIAL,
    billingCycle: BillingCycle.MONTHLY,
    startDate,
    endDate: defaultSubscriptionEnd(startDate, PlanType.TRIAL, BillingCycle.MONTHLY),
    applicationCodes: [],
  }
}

export function subscriptionDraftFrom(row: Subscription): SubscriptionDraft {
  return {
    planType: row.planType,
    billingCycle: row.billingCycle,
    startDate: row.startDate.slice(0, 10),
    endDate: row.endDate.slice(0, 10),
    applicationCodes: [...row.applicationCodes],
  }
}

export function subscriptionPeriodEnded(endDate: string, at = todayIso()) {
  return Boolean(endDate) && endDate < at
}

export function subscriptionIsInForce(row: Subscription) {
  return row.status === SubscriptionStatus.ACTIVE && row.applicationCodes.length > 0 && !subscriptionPeriodEnded(row.endDate)
}

export function validateSubscription(draft: SubscriptionDraft) {
  if (!draft.planType) return 'Plan type is required'
  if (!Object.values(PlanType).includes(draft.planType)) return 'Plan type is invalid'
  if (draft.planType === PlanType.PAID && !draft.billingCycle) return 'Billing cycle is required for paid plans'
  if (draft.billingCycle && !Object.values(BillingCycle).includes(draft.billingCycle)) {
    return 'Billing cycle is invalid'
  }
  if (!draft.startDate) return 'Start date is required'
  if (!draft.endDate) return 'End date is required'
  if (draft.endDate < draft.startDate) return 'End date must be on or after start date'
  if (!draft.applicationCodes.length) return 'Assign at least one application'
  return null
}

export function createSubscriptionPayload(draft: SubscriptionDraft) {
  return {
    startDate: draft.startDate,
    endDate: draft.endDate,
    planType: draft.planType,
    billingCycle: draft.billingCycle,
    applicationCodes: draft.applicationCodes,
  }
}

export function updateSubscriptionPayload(draft: SubscriptionDraft) {
  return createSubscriptionPayload(draft)
}
