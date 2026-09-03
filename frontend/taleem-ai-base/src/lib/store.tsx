import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import * as seed from '@/data/seed'
import { createId } from '@/lib/ids'
import type { SubscriptionDraft } from '@/lib/subscription'
import {
  EntitlementStatus,
  InvitationStatus,
  SubscriptionStatus,
  TenantStatus,
  UserStatus,
  type AdminInvitation,
  type AuditEvent,
  type CatalogApplication,
  type Entitlement,
  type InstitutionProfile,
  type Subscription,
  type Tenant,
  type TenantAddress,
  type TenantBranding,
  type TenantConfiguration,
  type TenantContact,
  type TenantIdentifier,
  type TenantSmtp,
  type TenantUser,
} from '@/lib/types'

export type Store = {
  tenants: Tenant[]
  profiles: InstitutionProfile[]
  contacts: TenantContact[]
  addresses: TenantAddress[]
  identifiers: TenantIdentifier[]
  configurations: TenantConfiguration[]
  smtp: TenantSmtp[]
  branding: TenantBranding[]
  applications: CatalogApplication[]
  subscriptions: Subscription[]
  entitlements: Entitlement[]
  invitations: AdminInvitation[]
  users: TenantUser[]
  auditEvents: AuditEvent[]
}

type StoreContextValue = {
  store: Store
  setStore: Dispatch<SetStateAction<Store>>
  addAudit: (event: Omit<AuditEvent, 'id' | 'at'> & { at?: string }) => void
  createSubscription: (tenantId: string, draft: SubscriptionDraft) => string
}

const StoreContext = createContext<StoreContextValue | null>(null)

const initial: Store = {
  tenants: seed.tenants,
  profiles: seed.profiles,
  contacts: seed.contacts,
  addresses: seed.addresses,
  identifiers: seed.identifiers,
  configurations: seed.configurations,
  smtp: seed.smtp,
  branding: seed.branding,
  applications: seed.applications,
  subscriptions: seed.subscriptions,
  entitlements: seed.entitlements,
  invitations: seed.invitations,
  users: seed.users,
  auditEvents: seed.auditEvents,
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(initial)

  const value = useMemo<StoreContextValue>(
    () => ({
      store,
      setStore,
      addAudit: (event) => {
        setStore((prev) => ({
          ...prev,
          auditEvents: [
            {
              id: createId('aud'),
              at: event.at ?? new Date().toISOString().slice(0, 16).replace('T', ' '),
              ...event,
            },
            ...prev.auditEvents,
          ],
        }))
      },
      createSubscription: (tenantId, draft) => {
        const subscriptionId = createId('sub')
        setStore((prev) => {
          const tenant = prev.tenants.find((row) => row.id === tenantId)
          const subscriptionCode = `${tenant?.tenantCode ?? 'sub'}-${draft.startDate.replaceAll('-', '')}`
          const remaining = prev.entitlements.filter(
            (row) =>
              !(row.tenantId === tenantId && row.applicationCode && draft.applicationCodes.includes(row.applicationCode)),
          )
          return {
            ...prev,
            subscriptions: [
              {
                id: subscriptionId,
                tenantId,
                subscriptionCode,
                status: SubscriptionStatus.ACTIVE,
                planType: draft.planType,
                billingCycle: draft.billingCycle,
                applicationCodes: draft.applicationCodes,
                startDate: draft.startDate,
                endDate: draft.endDate,
              },
              ...prev.subscriptions,
            ],
            entitlements: [
              ...draft.applicationCodes.map((applicationCode) => ({
                id: createId('ent'),
                tenantId,
                applicationCode,
                subscriptionId,
                status: EntitlementStatus.ACTIVE,
                effectiveFrom: draft.startDate,
                effectiveUntil: draft.endDate,
              })),
              ...remaining,
            ],
          }
        })
        return subscriptionId
      },
    }),
    [store],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function tenantById(store: Store, id: string) {
  return store.tenants.find((row) => row.id === id)
}

export { TenantStatus, SubscriptionStatus, EntitlementStatus, InvitationStatus, UserStatus }
