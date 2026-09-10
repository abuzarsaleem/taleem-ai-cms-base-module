/** Temporary hardcoded OAuth client — same for all users until dynamic lookup is wired. */
export const HARDCODED_OAUTH_CLIENT = {
  id: '7d70c68c-1fa3-4e46-9f5b-0c0b488dc892',
  applicationId: '948e0a9f-2576-411b-aa4c-b6f906538469',
  clientId: 'alumni-web',
  clientName: 'Alumni Web App',
  clientType: 'CONFIDENTIAL',
  clientSecret: 'AlumniClientSecret2026!',
  status: 'ACTIVE',
  redirectUris: ['http://localhost:3001/callback'],
} as const

export const DEFAULT_OAUTH_SCOPE = 'openid profile tenant.read'
