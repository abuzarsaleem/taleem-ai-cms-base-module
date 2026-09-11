/** OAuth clients for launching Alumni Portal / Alumni Admin from the tenant workspace. */

const PROD_ALUMNI_ORIGIN = 'https://taleem-ai-cms.vercel.app'
const PROD_ADMIN_ORIGIN = 'https://taleem-ai-admin.vercel.app'

function resolveUrl(fromEnv: string | undefined, localDefault: string, prodDefault: string) {
  const trimmed = fromEnv?.trim()
  if (trimmed) return trimmed.replace(/\/$/, '')
  if (import.meta.env.PROD) return prodDefault
  return localDefault
}

const alumniOrigin = resolveUrl(
  import.meta.env.VITE_ALUMNI_PORTAL_URL as string | undefined,
  'http://localhost:5173',
  PROD_ALUMNI_ORIGIN,
)

const adminOrigin = resolveUrl(
  import.meta.env.VITE_ADMIN_PORTAL_URL as string | undefined,
  'http://localhost:5174',
  PROD_ADMIN_ORIGIN,
)

export const DEFAULT_OAUTH_SCOPE = 'openid profile tenant.read'

export type LaunchableAppCode = 'ALUMNI' | 'ALUMNI_ADMIN'

export type AppOauthClientConfig = {
  applicationCode: LaunchableAppCode
  label: string
  description: string
  clientId: string
  clientSecret: string
  /** Catalog / env launch origin (OAuth opens {origin}/callback). */
  defaultLaunchUrl: string
}

export const APP_OAUTH_CLIENTS: Record<LaunchableAppCode, AppOauthClientConfig> = {
  ALUMNI: {
    applicationCode: 'ALUMNI',
    label: 'Alumni Portal',
    description: 'Member profile, directory, events, and announcements.',
    clientId:
      (import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined)?.trim() || 'alumni-web',
    clientSecret:
      (import.meta.env.VITE_OAUTH_CLIENT_SECRET as string | undefined)?.trim() ||
      'AlumniClientSecret2026!',
    defaultLaunchUrl: alumniOrigin,
  },
  ALUMNI_ADMIN: {
    applicationCode: 'ALUMNI_ADMIN',
    label: 'Alumni Admin Portal',
    description: 'Manage registrations, members, events, and news.',
    clientId:
      (import.meta.env.VITE_ADMIN_OAUTH_CLIENT_ID as string | undefined)?.trim() ||
      'alumni-admin',
    clientSecret:
      (import.meta.env.VITE_ADMIN_OAUTH_CLIENT_SECRET as string | undefined)?.trim() ||
      'AlumniAdminClientSecret2026!',
    defaultLaunchUrl: adminOrigin,
  },
}

/** Build OAuth redirect_uri from an application launch URL. */
export function callbackUriFromLaunchUrl(launchUrl: string) {
  const base = launchUrl.trim().replace(/\/$/, '')
  if (!base) throw new Error('Application launch URL is missing')
  try {
    const url = new URL(base)
    if (url.pathname.endsWith('/callback')) return url.toString().replace(/\/$/, '')
    url.pathname = '/callback'
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return `${base}/callback`
  }
}

export function oauthClientForApplication(applicationCode: string): AppOauthClientConfig | null {
  const code = applicationCode.trim().toUpperCase()
  if (code === 'ALUMNI' || code === 'ALUMNI_ADMIN') {
    return APP_OAUTH_CLIENTS[code]
  }
  return null
}

/** @deprecated — prefer APP_OAUTH_CLIENTS / oauthClientForApplication */
export type AlumniPortalTarget = 'alumni' | 'admin'

/** @deprecated */
export const ALUMNI_PORTAL_TARGETS: Record<
  AlumniPortalTarget,
  { label: string; description: string; redirectUri: string; applicationCode: LaunchableAppCode }
> = {
  alumni: {
    label: APP_OAUTH_CLIENTS.ALUMNI.label,
    description: APP_OAUTH_CLIENTS.ALUMNI.description,
    redirectUri: callbackUriFromLaunchUrl(APP_OAUTH_CLIENTS.ALUMNI.defaultLaunchUrl),
    applicationCode: 'ALUMNI',
  },
  admin: {
    label: APP_OAUTH_CLIENTS.ALUMNI_ADMIN.label,
    description: APP_OAUTH_CLIENTS.ALUMNI_ADMIN.description,
    redirectUri: callbackUriFromLaunchUrl(APP_OAUTH_CLIENTS.ALUMNI_ADMIN.defaultLaunchUrl),
    applicationCode: 'ALUMNI_ADMIN',
  },
}

/** @deprecated kept for older imports */
export const HARDCODED_OAUTH_CLIENT = {
  clientId: APP_OAUTH_CLIENTS.ALUMNI.clientId,
  clientSecret: APP_OAUTH_CLIENTS.ALUMNI.clientSecret,
  redirectUris: [
    callbackUriFromLaunchUrl(APP_OAUTH_CLIENTS.ALUMNI.defaultLaunchUrl),
    callbackUriFromLaunchUrl(APP_OAUTH_CLIENTS.ALUMNI_ADMIN.defaultLaunchUrl),
  ],
} as const
