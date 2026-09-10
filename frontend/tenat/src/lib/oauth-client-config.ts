/** OAuth client for launching Alumni member / admin portals from the tenant workspace. */
const alumniCallback =
  (import.meta.env.VITE_ALUMNI_PORTAL_CALLBACK as string | undefined)?.trim() ||
  'http://localhost:5173/callback'
const adminCallback =
  (import.meta.env.VITE_ADMIN_PORTAL_CALLBACK as string | undefined)?.trim() ||
  'http://localhost:5174/callback'

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
    // Production fallbacks (must also be registered on the oauth_clients row)
    'https://taleem-ai-cms.vercel.app/callback',
    'https://taleem-ai-cms.vercel.app/home',
  ],
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
