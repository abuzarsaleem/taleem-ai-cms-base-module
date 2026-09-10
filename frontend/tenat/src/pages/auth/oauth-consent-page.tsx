import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Field } from '@/components/field'
import { PasswordInput } from '@/components/password-input'
import { canUseTenantApp, errorMessage, roleFrom, useAuth } from '@/lib/auth'
import { HARDCODED_OAUTH_CLIENT } from '@/lib/oauth-client-config'
import {
  buildRedirectWithTokenParams,
  clearOAuthSession,
  isCompleteOAuthParams,
  loadOAuthSession,
  oauthParamsFromSearch,
  saveOAuthSession,
  type OAuthAuthorizeParams,
} from '@/lib/oauth'
import { oauthService, type OAuthAuthorizePreview } from '@/services/oauth'

/**
 * Fallback route if something still hits /oauth/consent.
 * Always auto-approves once the user is signed in — no Allow/Deny UI.
 */
export function OAuthConsentPage() {
  const [searchParams] = useSearchParams()
  const { session, ready, login, signOut } = useAuth()
  const [preview, setPreview] = useState<OAuthAuthorizePreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [loginBusy, setLoginBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const autoApproved = useRef(false)

  const oauthSearch = searchParams.toString()
  const oauthParams = oauthParamsFromSearch(oauthSearch)
  const paramsValid = isCompleteOAuthParams(oauthParams)

  const loadPreview = useCallback(async (params: OAuthAuthorizeParams) => {
    setError(null)
    try {
      const next = await oauthService.previewAuthorize(params)
      setPreview(next)
      return next
    } catch (caught) {
      setError(errorMessage(caught))
      return null
    }
  }, [])

  const completeWithApproval = useCallback(
    async (params: OAuthAuthorizeParams, tenantId: string) => {
      if (autoApproved.current) return
      autoApproved.current = true
      setBusy(true)
      setError(null)
      const pkce = loadOAuthSession()
      try {
        const result = await oauthService.submitConsent({
          client_id: params.client_id,
          redirect_uri: params.redirect_uri,
          scope: params.scope,
          state: params.state,
          code_challenge: params.code_challenge,
          code_challenge_method: params.code_challenge_method,
          tenant_id: tenantId,
          approved: true,
        })

        const consentUrl = new URL(result.redirectUri)
        const code = result.code ?? consentUrl.searchParams.get('code')
        if (!code) {
          throw new Error('No authorization code received from consent')
        }
        if (!pkce?.codeVerifier) {
          throw new Error('PKCE session expired. Sign in again.')
        }

        const tokens = await oauthService.exchangeAuthorizationCode({
          code,
          redirect_uri: params.redirect_uri,
          client_id: HARDCODED_OAUTH_CLIENT.clientId,
          client_secret: HARDCODED_OAUTH_CLIENT.clientSecret,
          code_verifier: pkce.codeVerifier,
        })

        clearOAuthSession()
        window.location.assign(
          buildRedirectWithTokenParams(params.redirect_uri, tokens, {
            state: params.state,
          }),
        )
      } catch (caught) {
        autoApproved.current = false
        setError(errorMessage(caught))
        toast.error(errorMessage(caught))
        setBusy(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!ready || !paramsValid) return

    const params = oauthParamsFromSearch(oauthSearch)
    if (!isCompleteOAuthParams(params)) return

    const pkce = loadOAuthSession()
    if (pkce?.state && params.state && pkce.state !== params.state) {
      setError('OAuth session mismatch. Start the sign-in flow again from the application.')
      return
    }

    saveOAuthSession({ ...params, codeVerifier: pkce?.codeVerifier })

    if (!session) return

    void (async () => {
      const next = preview ?? (await loadPreview(params))
      if (!next) return
      const tenantId =
        (session.tenantId && next.tenants.some((t) => t.tenantId === session.tenantId)
          ? session.tenantId
          : null) || next.tenants[0]?.tenantId
      if (!tenantId) {
        setError('No entitled institution available for this application')
        return
      }
      await completeWithApproval(params, tenantId)
    })()
  }, [
    completeWithApproval,
    loadPreview,
    oauthSearch,
    paramsValid,
    preview,
    ready,
    session,
  ])

  async function submitLogin() {
    setLoginBusy(true)
    setError(null)
    try {
      const nextSession = await login(email.trim(), password)
      const role = roleFrom(nextSession)
      if (!canUseTenantApp(role)) {
        signOut()
        toast.error('This portal is for tenant administrators and members.')
        return
      }
    } catch (caught) {
      setError(errorMessage(caught))
      toast.error(errorMessage(caught))
    } finally {
      setLoginBusy(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-72 w-full max-w-lg rounded-[var(--radius)]" />
      </div>
    )
  }

  if (!paramsValid) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <Card className="portal-card w-full max-w-lg">
          <CardHeader>
            <CardTitle>Opening application</CardTitle>
            <CardDescription>Missing OAuth parameters. Start from the apps page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <Card className="portal-card w-full max-w-lg">
          <CardHeader>
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>
              Sign in with your tenant account. Access is authorized automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitLogin()
                }}
              />
            </Field>
            <Button
              className="w-full"
              disabled={loginBusy || !email || !password}
              onClick={() => void submitLogin()}
            >
              {loginBusy ? 'Signing in…' : 'Sign in and continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="portal-card w-full max-w-lg">
        <CardHeader>
          <CardTitle>Opening application</CardTitle>
          <CardDescription>
            Authorizing access automatically. You will be redirected shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <div className="space-y-3 py-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <p className="text-center text-sm text-muted-foreground">
                {busy ? 'Redirecting…' : 'Preparing authorization…'}
              </p>
            </div>
          )}
          {error ? (
            <Button variant="outline" asChild>
              <Link to="/tenant/apps">Back to apps</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
