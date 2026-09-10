import { DEFAULT_OAUTH_SCOPE, HARDCODED_OAUTH_CLIENT } from '@/lib/oauth-client-config'

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

export function isCompleteOAuthParams(params: Partial<OAuthAuthorizeParams>): params is OAuthAuthorizeParams {
  return Boolean(
    params.client_id &&
      params.redirect_uri &&
      params.code_challenge &&
      params.code_challenge_method &&
      params.response_type,
  )
}

export function pickRedirectUri(redirectUris: string[], launchUrl?: string) {
  if (launchUrl && redirectUris.includes(launchUrl)) return launchUrl
  if (launchUrl) {
    try {
      const callback = new URL('/callback', launchUrl).toString()
      if (redirectUris.includes(callback)) return callback
    } catch {
      /* ignore invalid launch URL */
    }
  }
  return redirectUris[0]
}

export async function buildHardcodedOAuthConsentPath() {
  const redirectUri = pickRedirectUri([...HARDCODED_OAUTH_CLIENT.redirectUris])
  if (!redirectUri) {
    throw new Error('No redirect URI configured for OAuth client')
  }

  const params = await buildOAuthLaunchParams({
    clientId: HARDCODED_OAUTH_CLIENT.clientId,
    redirectUri,
    scope: DEFAULT_OAUTH_SCOPE,
  })

  return `/oauth/consent?${oauthSearchFromParams(params)}`
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
