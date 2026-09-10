import { apiRequest } from '@/lib/api'
import type { OAuthAuthorizeParams } from '@/lib/oauth'

export type OAuthAuthorizePreview = {
  clientId: string
  clientName: string
  redirectUri: string
  scope?: string
  state?: string
  applicationCode?: string
  scopes: Array<{ scopeCode: string; name: string; description?: string }>
  tenants: Array<{ tenantId: string; tenantCode: string; displayName: string }>
}

export type OAuthConsentResult = {
  redirectUri: string
  code?: string
  state?: string
  error?: string
}

export type OAuthTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope?: string
}

export const oauthService = {
  previewAuthorize(params: OAuthAuthorizeParams) {
    const qs = new URLSearchParams({
      client_id: params.client_id,
      response_type: params.response_type,
      redirect_uri: params.redirect_uri,
      code_challenge: params.code_challenge,
      code_challenge_method: params.code_challenge_method,
    })
    if (params.scope) qs.set('scope', params.scope)
    if (params.state) qs.set('state', params.state)
    return apiRequest<OAuthAuthorizePreview>(`/oauth/authorize?${qs.toString()}`)
  },

  submitConsent(body: {
    client_id: string
    redirect_uri: string
    scope?: string
    state?: string
    code_challenge: string
    code_challenge_method: string
    tenant_id: string
    approved: boolean
  }) {
    return apiRequest<OAuthConsentResult>('/oauth/authorize/consent', { method: 'POST', body })
  },

  exchangeAuthorizationCode(body: {
    code: string
    redirect_uri: string
    client_id: string
    client_secret: string
    code_verifier: string
  }) {
    return apiRequest<OAuthTokenResponse>('/oauth/token', {
      method: 'POST',
      token: null,
      body: {
        grant_type: 'authorization_code',
        code: body.code,
        redirect_uri: body.redirect_uri,
        client_id: body.client_id,
        client_secret: body.client_secret,
        code_verifier: body.code_verifier,
      },
    })
  },
}
