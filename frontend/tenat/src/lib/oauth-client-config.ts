/** OAuth client for launching Alumni member / admin portals from the tenant workspace. */

/** Production alumni portal: https://taleem-ai-cms.vercel.app/ */
const PROD_ALUMNI_CALLBACK = 'https://taleem-ai-cms.vercel.app/callback'
/** Production admin portal: https://taleem-ai-admin.vercel.app/ */
const PROD_ADMIN_CALLBACK = 'https://taleem-ai-admin.vercel.app/callback'

function resolveCallback(
  fromEnv: string | undefined,
  localDefault: string,
  prodDefault?: string,
) {
  const trimmed = fromEnv?.trim()
  if (trimmed) return trimmed
  if (import.meta.env.PROD && prodDefault) return prodDefault
  return localDefault
}

const alumniCallback = resolveCallback(
  import.meta.env.VITE_ALUMNI_PORTAL_CALLBACK as string | undefined,
  'http://localhost:5173/callback',
  PROD_ALUMNI_CALLBACK,
)

const adminCallback = resolveCallback(
  import.meta.env.VITE_ADMIN_PORTAL_CALLBACK as string | undefined,
  'http://localhost:5174/callback',
  PROD_ADMIN_CALLBACK,
)

export const HARDCODED_OAUTH_CLIENT = {
  id: '7d70c68c-1fa3-4e46-9f5b-0c0b488dc892',
  applicationId: '948e0a9f-2576-411b-aa4c-b6f906538469',
  clientId: (import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined)?.trim() || 'alumni-web',
  clientName: 'Alumni Web App',
  clientType: 'CONFIDENTIAL',
  /** Confidential secret — prefer server-side exchange later; kept for current consent flow. */
  clientSecret:
    (import.meta.env.VITE_OAUTH_CLIENT_SECRET as string | undefined)?.trim() ||
    'AlumniClientSecret2026!',
  status: 'ACTIVE',
  redirectUris: [
    alumniCallback,
    adminCallback,
    'http://localhost:5173/callback',
    'http://localhost:5174/callback',
    PROD_ALUMNI_CALLBACK,
    'https://taleem-ai-cms.vercel.app/home',
    PROD_ADMIN_CALLBACK,
  ].filter((uri, index, all) => all.indexOf(uri) === index),
} as const

export const DEFAULT_OAUTH_SCOPE = 'openid profile tenant.read'

export type AlumniPortalTarget = 'alumni' | 'admin'

export const ALUMNI_PORTAL_TARGETS: Record<
  AlumniPortalTarget,
  { label: string; description: string; redirectUri: string }
> = {
  alumni: {
    label: 'Alumni Portal',
    description: 'Member profile, directory, events, and announcements.',
    redirectUri: alumniCallback,
  },
  admin: {
    label: 'Alumni Admin',
    description: 'Manage registrations, members, events, and news.',
    redirectUri: adminCallback,
  },
}
