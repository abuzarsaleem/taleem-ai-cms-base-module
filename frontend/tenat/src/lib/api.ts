import type { AuthTokenResponse, Session } from '@/lib/types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1'
const SESSION_KEY = 'taleem.tenant.session'
const SESSION_EVENT = 'taleem:tenant-session'
const UNAUTHORIZED_EVENT = 'taleem:unauthorized'

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/accept-invitation',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/oauth/token',
  '/oauth/revoke',
])

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function readStoredSession(): Session | null {
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

export function writeStoredSession(session: Session | null) {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getStoredToken() {
  return readStoredSession()?.accessToken ?? null
}

export { SESSION_KEY, SESSION_EVENT, UNAUTHORIZED_EVENT }

function messageFromBody(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback
  const record = body as { message?: string | string[]; error?: string }
  if (Array.isArray(record.message)) return record.message.join(', ')
  if (typeof record.message === 'string' && record.message) return record.message
  if (typeof record.error === 'string' && record.error) return record.error
  return fallback
}

function pathOnly(path: string) {
  return path.split('?')[0] ?? path
}

function isPublicAuthPath(path: string) {
  return PUBLIC_AUTH_PATHS.has(pathOnly(path))
}

function jwtExpiresAt(token: string) {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const json = atob(segment.replaceAll('-', '+').replaceAll('_', '/'))
    const payload = JSON.parse(json) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function accessTokenNeedsRefresh(token: string, skewMs = 20_000) {
  const expiresAt = jwtExpiresAt(token)
  if (expiresAt == null) return false
  return expiresAt - Date.now() <= skewMs
}

function dispatchUnauthorized() {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

function applyRefreshedSession(current: Session, tokens: AuthTokenResponse): Session {
  return {
    ...current,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      ...current.user,
      id: tokens.user.id,
      email: tokens.user.email,
      fullName: tokens.user.fullName,
      roles: tokens.user.roles ?? current.user.roles,
      permissions: tokens.user.permissions ?? current.user.permissions,
      emailVerified: tokens.user.emailVerified,
      avatarUrl: tokens.user.avatarUrl,
    },
  }
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const session = readStoredSession()
    if (!session?.refreshToken) return false

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
      const text = await response.text()
      let parsed: unknown = null
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown
        } catch {
          parsed = null
        }
      }
      if (!response.ok) return false

      const tokens = parsed as AuthTokenResponse
      if (!tokens?.accessToken || !tokens.refreshToken) return false

      const next = applyRefreshedSession(session, tokens)
      writeStoredSession(next)
      window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: next }))
      return true
    } catch {
      return false
    }
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

async function ensureFreshAccessToken(token: string | null) {
  if (!token) return token
  if (!accessTokenNeedsRefresh(token)) return token
  const session = readStoredSession()
  if (!session?.refreshToken) return token
  const refreshed = await refreshSession()
  if (refreshed) return getStoredToken()
  dispatchUnauthorized()
  return null
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      parsed = { message: text }
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, messageFromBody(parsed, response.statusText || 'Request failed'))
  }

  return parsed as T
}

async function sendAndParse<T>(
  path: string,
  init: RequestInit,
  allowRefresh: boolean,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  if (response.status !== 401 || !allowRefresh || isPublicAuthPath(path)) {
    return parseResponse<T>(response)
  }

  const refreshed = await refreshSession()
  if (!refreshed) {
    dispatchUnauthorized()
    return parseResponse<T>(response)
  }

  const retryHeaders = new Headers(init.headers)
  const nextToken = getStoredToken()
  if (nextToken) retryHeaders.set('Authorization', `Bearer ${nextToken}`)
  else retryHeaders.delete('Authorization')

  return parseResponse<T>(await fetch(`${API_BASE}${path}`, { ...init, headers: retryHeaders }))
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string
    body?: unknown
    token?: string | null
    headers?: Record<string, string>
  } = {},
): Promise<T> {
  const stored = options.token === undefined ? getStoredToken() : options.token
  const token = options.token === undefined ? await ensureFreshAccessToken(stored) : stored
  const headers: Record<string, string> = { ...options.headers }
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(options.body)
  }
  if (token) headers.Authorization = `Bearer ${token}`

  return sendAndParse<T>(path, init, options.token !== null && !isPublicAuthPath(path))
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = await ensureFreshAccessToken(getStoredToken())
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return sendAndParse<T>(
    path,
    {
      method: 'POST',
      headers,
      body: formData,
    },
    !isPublicAuthPath(path),
  )
}
