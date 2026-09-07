import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ApiError,
  readStoredSession,
  SESSION_EVENT,
  UNAUTHORIZED_EVENT,
  writeStoredSession,
} from '@/lib/api'
import { authUserFrom } from '@/lib/account'
import { pickCurrentTenant } from '@/lib/membership'
import type { AuthTokenResponse, AuthUser, Role, Session, UserProfile, UserTenantMembership } from '@/lib/types'
import { authService, userProfileService } from '@/services/account'
import { membershipService } from '@/services/platform'

type AuthContextValue = {
  session: Session | null
  ready: boolean
  token: string | null
  signIn: (session: Session) => void
  signOut: () => void
  login: (email: string, password: string) => Promise<Session>
  completeAuth: (tokens: AuthTokenResponse) => Promise<Session>
  applyProfile: (profile: UserProfile) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function persist(session: Session | null) {
  writeStoredSession(session)
}

export async function attachMemberships(
  accessToken: string,
  user: AuthUser,
  refreshToken?: string,
): Promise<Session> {
  try {
    const page = await membershipService.listMine(1, 50, accessToken)
    const memberships = page.data
    return {
      accessToken,
      refreshToken,
      user,
      memberships,
      tenantId: pickCurrentTenant(memberships)?.tenantId,
    }
  } catch {
    return { accessToken, refreshToken, user, memberships: [] }
  }
}

export function roleFrom(session: Session | null | undefined): Role | null {
  const account = session?.user
  if (!account) return null
  if (account.roles.includes('PLATFORM_ADMIN')) return 'PLATFORM_ADMIN'
  if (account.roles.includes('TENANT_ADMIN')) return 'TENANT_ADMIN'
  const memberships = session?.memberships ?? []
  if (memberships.some((row: UserTenantMembership) => row.isTenantAdmin && row.membershipStatus === 'ACTIVE')) {
    return 'TENANT_ADMIN'
  }
  if (account.roles.includes('TENANT_MEMBER')) return 'TENANT_MEMBER'
  if (memberships.some((row: UserTenantMembership) => row.membershipStatus === 'ACTIVE')) {
    return 'TENANT_MEMBER'
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readStoredSession())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onUnauthorized = () => {
      persist(null)
      setSession(null)
    }
    const onSession = (event: Event) => {
      const next = (event as CustomEvent<Session>).detail
      if (next?.accessToken) setSession(next)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    window.addEventListener(SESSION_EVENT, onSession)
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
      window.removeEventListener(SESSION_EVENT, onSession)
    }
  }, [])

  useEffect(() => {
    const current = readStoredSession()
    if (!current) {
      setReady(true)
      return
    }

    const hydrate = current.memberships === undefined
      ? attachMemberships(current.accessToken, current.user, current.refreshToken)
      : Promise.resolve(current)

    hydrate
      .then(async (withMemberships) => {
        persist(withMemberships)
        setSession(withMemberships)
        try {
          const profile = await userProfileService.get()
          const next = {
            ...withMemberships,
            user: authUserFrom(profile, withMemberships.user),
          }
          persist(next)
          setSession(next)
        } catch {
          /* keep token session if profile cannot be loaded */
        }
      })
      .finally(() => setReady(true))
  }, [])

  const signOut = useCallback(() => {
    const refreshToken = readStoredSession()?.refreshToken
    persist(null)
    setSession(null)
    if (refreshToken) {
      void authService.logout(refreshToken).catch(() => undefined)
    }
  }, [])

  const applyProfile = useCallback((profile: UserProfile) => {
    const current = readStoredSession()
    if (!current) return
    const next = { ...current, user: authUserFrom(profile, current.user) }
    persist(next)
    setSession(next)
  }, [])

  const completeAuth = useCallback(async (tokens: AuthTokenResponse) => {
    const user = authUserFrom(tokens.user)
    persist({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user })
    const next = await attachMemberships(tokens.accessToken, user, tokens.refreshToken)
    persist(next)
    setSession(next)
    return next
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authService.login(email, password)
    const user = authUserFrom(tokens.user)
    persist({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user })
    const next = await attachMemberships(tokens.accessToken, user, tokens.refreshToken)
    persist(next)
    setSession(next)
    return next
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      token: session?.accessToken ?? null,
      signIn: (next) => {
        persist(next)
        setSession(next)
      },
      signOut,
      applyProfile,
      completeAuth,
      login,
    }),
    [session, ready, signOut, applyProfile, completeAuth, login],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const APP_HOME = '/tenant'
export const APP_ACCOUNT = '/tenant/account'

export function canUseTenantApp(role: Role | null | undefined) {
  return role === 'TENANT_ADMIN' || role === 'TENANT_MEMBER'
}

export function roleLabelFor(role: Role | null | undefined) {
  if (role === 'TENANT_ADMIN') return 'Tenant administrator'
  if (role === 'TENANT_MEMBER') return 'Tenant member'
  return 'User'
}

export function homeFor(role?: Role | null) {
  return role === 'TENANT_MEMBER' ? APP_ACCOUNT : APP_HOME
}

export function accountPathFor(_role?: Role) {
  return APP_ACCOUNT
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
