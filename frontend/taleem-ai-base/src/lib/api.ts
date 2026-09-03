const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1'
const SESSION_KEY = 'taleem.session'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getStoredToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken?: string }
    return parsed.accessToken ?? null
  } catch {
    return null
  }
}

export { SESSION_KEY }

function messageFromBody(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback
  const record = body as { message?: string | string[]; error?: string }
  if (Array.isArray(record.message)) return record.message.join(', ')
  if (typeof record.message === 'string' && record.message) return record.message
  if (typeof record.error === 'string' && record.error) return record.error
  return fallback
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
  const token = options.token === undefined ? getStoredToken() : options.token
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

  const response = await fetch(`${API_BASE}${path}`, init)
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
    if (response.status === 401) {
      window.dispatchEvent(new Event('taleem:unauthorized'))
    }
    throw new ApiError(response.status, messageFromBody(parsed, response.statusText || 'Request failed'))
  }

  return parsed as T
}
