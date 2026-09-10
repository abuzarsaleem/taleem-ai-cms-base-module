import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationIcon } from '@/components/application-icon'
import { Field } from '@/components/field'
import { PasswordInput } from '@/components/password-input'
import { canUseTenantApp, errorMessage, homeFor, roleFrom, useAuth } from '@/lib/auth'
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

export function OAuthConsentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, ready, login, signOut } = useAuth()
  const [preview, setPreview] = useState<OAuthAuthorizePreview | null>(null)
  const [tenantId, setTenantId] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loginBusy, setLoginBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const oauthSearch = searchParams.toString()
  const oauthParams = oauthParamsFromSearch(oauthSearch)
  const paramsValid = isCompleteOAuthParams(oauthParams)

  const loadPreview = useCallback(async (params: OAuthAuthorizeParams) => {
    setLoadingPreview(true)
    setError(null)
    try {
      const next = await oauthService.previewAuthorize(params)
      setPreview(next)
      setTenantId(next.tenants[0]?.tenantId ?? '')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoadingPreview(false)
    }
  }, [])

  useEffect(() => {
    if (!ready || !paramsValid) return

    if (session && roleFrom(session) === 'TENANT_ADMIN') {
      navigate(homeFor('TENANT_ADMIN'), { replace: true })
      return
    }

    const params = oauthParamsFromSearch(oauthSearch)
    if (!isCompleteOAuthParams(params)) return

    const pkce = loadOAuthSession()
    if (pkce?.state && params.state && pkce.state !== params.state) {
      setError('OAuth session mismatch. Start the sign-in flow again from the application.')
      return
    }

    saveOAuthSession({ ...params, codeVerifier: pkce?.codeVerifier })

    if (session) {
      void loadPreview(params)
    }
  }, [loadPreview, navigate, oauthSearch, paramsValid, ready, session])

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
      if (role === 'TENANT_ADMIN') {
        navigate(homeFor(role), { replace: true })
        return
      }
      if (!paramsValid) return
      await loadPreview(oauthParams)
    } catch (caught) {
      setError(errorMessage(caught))
      toast.error(errorMessage(caught))
    } finally {
      setLoginBusy(false)
    }
  }

  async function submitConsent(approved: boolean) {
    if (!paramsValid || !tenantId) return
    setBusy(true)
    setError(null)
    const pkce = loadOAuthSession()
    try {
      const result = await oauthService.submitConsent({
        client_id: oauthParams.client_id,
        redirect_uri: oauthParams.redirect_uri,
        scope: oauthParams.scope,
        state: oauthParams.state,
        code_challenge: oauthParams.code_challenge,
        code_challenge_method: oauthParams.code_challenge_method,
        tenant_id: tenantId,
        approved,
      })

      if (!approved) {
        clearOAuthSession()
        window.location.assign(result.redirectUri)
        return
      }

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
        redirect_uri: oauthParams.redirect_uri,
        client_id: HARDCODED_OAUTH_CLIENT.clientId,
        client_secret: HARDCODED_OAUTH_CLIENT.clientSecret,
        code_verifier: pkce.codeVerifier,
      })

      clearOAuthSession()
      window.location.assign(
        buildRedirectWithTokenParams(oauthParams.redirect_uri, tokens, {
          state: oauthParams.state,
        }),
      )
    } catch (caught) {
      setError(errorMessage(caught))
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
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
            <CardTitle>Authorize application</CardTitle>
            <CardDescription>Missing OAuth parameters. Start from an application sign-in link.</CardDescription>
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

  const showLogin = !session
  const showConsent = Boolean(session && preview)
  const showLoading = Boolean(session && (loadingPreview || (!preview && !error)))

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="portal-card w-full max-w-lg">
        <CardHeader>
          <CardTitle>Authorize application</CardTitle>
          <CardDescription>
            {showLogin
              ? 'Sign in to Taleem, review scopes, then allow access.'
              : 'Review what this application can access, then allow or deny.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {showLogin ? (
            <>
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
            </>
          ) : null}

          {showLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : null}

          {showConsent && preview ? (
            <>
              {session ? (
                <p className="text-sm text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
                </p>
              ) : null}

              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                <ApplicationIcon code={preview.applicationCode ?? preview.clientId} />
                <div className="min-w-0">
                  <p className="font-medium">{preview.clientName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{preview.clientId}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Scopes</p>
                <ul className="space-y-1.5 rounded-xl border border-border px-3 py-2 text-sm">
                  {preview.scopes.map((scope) => (
                    <li key={scope.scopeCode}>
                      <span className="font-medium">{scope.name}</span>
                      <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                        {scope.scopeCode}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Institution</p>
                <Select value={tenantId || undefined} onValueChange={setTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {preview.tenants.map((tenant) => (
                      <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.displayName} ({tenant.tenantCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button disabled={busy || !tenantId} onClick={() => void submitConsent(true)}>
                  {busy ? 'Authorizing…' : 'Allow access'}
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => void submitConsent(false)}>
                  Deny
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
