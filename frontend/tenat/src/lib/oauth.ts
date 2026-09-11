import {
  ALUMNI_PORTAL_TARGETS,
  APP_OAUTH_CLIENTS,
  DEFAULT_OAUTH_SCOPE,
  HARDCODED_OAUTH_CLIENT,
  callbackUriFromLaunchUrl,
  oauthClientForApplication,
  type AlumniPortalTarget,
  type LaunchableAppCode,
} from '@/lib/oauth-client-config'

export type OAuthAuthorizeParams = {
  client_id: string
  response_type: string
  redirect_uri: string
  scope?: string
  state?: string
  code_challenge: string
  code_challenge_method: string
}

export type OAuthPkceSession = OAuthAuthorizeParams & {
  codeVerifier?: string
  returnTo?: string
}

export const OAUTH_PKCE_STORAGE_KEY = 'taleem_oauth_pkce'

export function randomBase64Url(bytes = 32) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  let binary = ''
  for (const b of arr) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sha256Base64Url(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  let binary = ''
  for (const b of new Uint8Array(digest)) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function saveOAuthSession(payload: OAuthPkceSession) {
  sessionStorage.setItem(OAUTH_PKCE_STORAGE_KEY, JSON.stringify(payload))
}

export function loadOAuthSession(): OAuthPkceSession | null {
  const raw = sessionStorage.getItem(OAUTH_PKCE_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OAuthPkceSession
  } catch {
    return null
  }
}

export function clearOAuthSession() {
  sessionStorage.removeItem(OAUTH_PKCE_STORAGE_KEY)
}

export function oauthParamsFromSearch(search: string): Partial<OAuthAuthorizeParams> {
  const params = new URLSearchParams(search)
  return {
    client_id: params.get('client_id') ?? undefined,
    response_type: params.get('response_type') ?? 'code',
    redirect_uri: params.get('redirect_uri') ?? undefined,
    scope: params.get('scope') ?? undefined,
    state: params.get('state') ?? undefined,
    code_challenge: params.get('code_challenge') ?? undefined,
    code_challenge_method: params.get('code_challenge_method') ?? 'S256',
  }
}

export function oauthSearchFromParams(params: OAuthAuthorizeParams) {
  const search = new URLSearchParams()
  search.set('client_id', params.client_id)
  search.set('response_type', params.response_type)
  search.set('redirect_uri', params.redirect_uri)
  if (params.scope) search.set('scope', params.scope)
  if (params.state) search.set('state', params.state)
  search.set('code_challenge', params.code_challenge)
  search.set('code_challenge_method', params.code_challenge_method)
  return search.toString()
}

export function isCompleteOAuthParams(
  params: Partial<OAuthAuthorizeParams>,
): params is OAuthAuthorizeParams {
  return Boolean(
    params.client_id &&
      params.redirect_uri &&
      params.code_challenge &&
      params.code_challenge_method &&
      params.response_type,
  )
}

export function pickRedirectUri(redirectUris: string[], preferred?: string) {
  if (preferred && redirectUris.includes(preferred)) return preferred
  if (preferred) {
    try {
      const callback = new URL('/callback', preferred).toString()
      if (redirectUris.includes(callback)) return callback
    } catch {
      /* ignore */
    }
  }
  return redirectUris[0]
}

export async function buildOAuthLaunchParams(input: {
  clientId: string
  redirectUri: string
  scope: string
}) {
  const codeVerifier = randomBase64Url(32)
  const codeChallenge = await sha256Base64Url(codeVerifier)
  const state = randomBase64Url(16)
  const params: OAuthAuthorizeParams = {
    client_id: input.clientId,
    response_type: 'code',
    redirect_uri: input.redirectUri,
    scope: input.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }
  saveOAuthSession({ ...params, codeVerifier })
  return params
}

export type OAuthTokenPayload = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope?: string
}

export function buildRedirectWithTokenParams(
  redirectUri: string,
  tokens: OAuthTokenPayload,
  extra?: { state?: string },
) {
  const url = new URL(redirectUri)
  url.searchParams.set('access_token', tokens.access_token)
  url.searchParams.set('token_type', tokens.token_type)
  url.searchParams.set('expires_in', String(tokens.expires_in))
  url.searchParams.set('refresh_token', tokens.refresh_token)
  if (tokens.scope) url.searchParams.set('scope', tokens.scope)
  if (extra?.state) url.searchParams.set('state', extra.state)
  return url.toString()
}

/**
 * Open an entitled application via OAuth using its catalog launch URL.
 * Consent is always approved; tokens are exchanged and the browser redirects.
 */
export async function silentLaunchApplication(input: {
  applicationCode: string
  launchUrl?: string | null
  preferredTenantId?: string
}) {
  const { oauthService } = await import('@/services/oauth')

  const client = oauthClientForApplication(input.applicationCode)
  if (!client) {
    throw new Error(`No OAuth client configured for ${input.applicationCode}`)
  }

  const launchUrl = (input.launchUrl?.trim() || client.defaultLaunchUrl).replace(/\/$/, '')
  const redirectUri = callbackUriFromLaunchUrl(launchUrl)

  const params = await buildOAuthLaunchParams({
    clientId: client.clientId,
    redirectUri,
    scope: DEFAULT_OAUTH_SCOPE,
  })

  const preview = await oauthService.previewAuthorize(params)
  const tenantId =
    (input.preferredTenantId &&
      preview.tenants.some((t) => t.tenantId === input.preferredTenantId) &&
      input.preferredTenantId) ||
    preview.tenants[0]?.tenantId

  if (!tenantId) {
    throw new Error('No entitled institution available for this application')
  }

  const pkce = loadOAuthSession()
  if (!pkce?.codeVerifier) {
    throw new Error('OAuth session expired. Sign in again.')
  }

  const consent = await oauthService.submitConsent({
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    scope: params.scope,
    state: params.state,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method,
    tenant_id: tenantId,
    approved: true,
  })

  const consentUrl = new URL(consent.redirectUri)
  const code = consent.code ?? consentUrl.searchParams.get('code')
  if (!code) {
    throw new Error('No authorization code received')
  }

  const tokens = await oauthService.exchangeAuthorizationCode({
    code,
    redirect_uri: params.redirect_uri,
    client_id: client.clientId,
    client_secret: client.clientSecret,
    code_verifier: pkce.codeVerifier,
  })

  clearOAuthSession()
  window.location.assign(
    buildRedirectWithTokenParams(params.redirect_uri, tokens, { state: params.state }),
  )
}

/** Open Alumni member/admin portal without showing the consent UI. */
export async function silentLaunchAlumniPortal(
  target: AlumniPortalTarget,
  preferredTenantId?: string,
) {
  const code: LaunchableAppCode =
    target === 'admin' ? 'ALUMNI_ADMIN' : 'ALUMNI'
  return silentLaunchApplication({
    applicationCode: code,
    launchUrl: APP_OAUTH_CLIENTS[code].defaultLaunchUrl,
    preferredTenantId,
  })
}

/** Start OAuth consent for Alumni member or admin portal. */
export async function buildAlumniPortalConsentPath(target: AlumniPortalTarget) {
  const preferred = ALUMNI_PORTAL_TARGETS[target].redirectUri
  const client =
    target === 'admin' ? APP_OAUTH_CLIENTS.ALUMNI_ADMIN : APP_OAUTH_CLIENTS.ALUMNI
  const redirectUri = pickRedirectUri(
    [...HARDCODED_OAUTH_CLIENT.redirectUris, preferred],
    preferred,
  )
  if (!redirectUri) {
    throw new Error('No redirect URI configured for OAuth client')
  }

  const params = await buildOAuthLaunchParams({
    clientId: client.clientId,
    redirectUri,
    scope: DEFAULT_OAUTH_SCOPE,
  })

  return `/oauth/consent?${oauthSearchFromParams(params)}`
}

/** @deprecated use buildAlumniPortalConsentPath */
export async function buildHardcodedOAuthConsentPath() {
  return buildAlumniPortalConsentPath('alumni')
}
