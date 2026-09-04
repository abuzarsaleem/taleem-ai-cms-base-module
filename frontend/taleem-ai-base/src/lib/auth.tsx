import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SESSION_KEY } from '@/lib/api'
import { ApiError, apiRequest } from '@/lib/api'
import { pickCurrentTenant } from '@/lib/membership'
import type { AuthUser, Role, Session, UserTenantMembership } from '@/lib/types'
import { membershipService } from '@/services/platform'

type AuthContextValue = {
  session: Session | null
  ready: boolean
  token: string | null
  signIn: (session: Session) => void
  signOut: () => void
  login: (email: string, password: string) => Promise<Session>
  completeAuth: (accessToken: string, user: AuthUser) => Promise<Session>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.accessToken || !parsed.user) return null
    return parsed
  } catch {
    return null
  }
}

function persist(session: Session | null) {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function attachMemberships(accessToken: string, user: AuthUser): Promise<Session> {
  try {
    const page = await membershipService.listMine(1, 50, accessToken)
    const memberships = page.data
    return {
      accessToken,
      user,
      memberships,
      tenantId: pickCurrentTenant(memberships)?.tenantId,
    }
  } catch {
    return { accessToken, user, memberships: [] }
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
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onUnauthorized = () => {
      persist(null)
      setSession(null)
    }
    window.addEventListener('taleem:unauthorized', onUnauthorized)
    return () => window.removeEventListener('taleem:unauthorized', onUnauthorized)
  }, [])

  useEffect(() => {
    const current = readSession()
    if (!current) {
      setReady(true)
      return
    }
    if (current.memberships !== undefined) {
      setReady(true)
      return
    }
    attachMemberships(current.accessToken, current.user)
      .then((next) => {
        persist(next)
        setSession(next)
      })
      .finally(() => setReady(true))
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
      signOut: () => {
        persist(null)
        setSession(null)
      },
      completeAuth: async (accessToken, user) => {
        const next = await attachMemberships(accessToken, user)
        persist(next)
        setSession(next)
        return next
      },
      login: async (email, password) => {
        const result = await apiRequest<{
          accessToken: string
          tokenType: string
          expiresIn: string
          user: AuthUser
        }>('/auth/login', {
          method: 'POST',
          body: { email, password },
          token: null,
        })
        const next = await attachMemberships(result.accessToken, result.user)
        persist(next)
        setSession(next)
        return next
      },
    }),
    [session, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function homeFor(role: Role) {
  return role === 'PLATFORM_ADMIN' ? '/platform' : '/tenant'
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
