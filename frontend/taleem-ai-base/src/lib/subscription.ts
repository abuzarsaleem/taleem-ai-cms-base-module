import { BillingCycle, PlanType } from '@/lib/types'

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
