import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SESSION_KEY } from '@/lib/api'
import { ApiError, apiRequest } from '@/lib/api'
import type { AuthUser, Role, Session } from '@/lib/types'

type AuthContextValue = {
  session: Session | null
  token: string | null
  signIn: (session: Session) => void
  signOut: () => void
  login: (email: string, password: string) => Promise<Session>
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

export function roleFrom(user: AuthUser): Role | null {
  if (user.roles.includes('PLATFORM_ADMIN')) return 'PLATFORM_ADMIN'
  if (user.roles.includes('TENANT_ADMIN')) return 'TENANT_ADMIN'
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  useEffect(() => {
    const onUnauthorized = () => {
      persist(null)
      setSession(null)
    }
    window.addEventListener('taleem:unauthorized', onUnauthorized)
    return () => window.removeEventListener('taleem:unauthorized', onUnauthorized)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      token: session?.accessToken ?? null,
      signIn: (next) => {
        persist(next)
        setSession(next)
      },
      signOut: () => {
        persist(null)
        setSession(null)
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
        const next: Session = {
          accessToken: result.accessToken,
          user: result.user,
        }
        persist(next)
        setSession(next)
        return next
      },
    }),
    [session],
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
