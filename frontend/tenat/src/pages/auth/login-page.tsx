import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/field'
import { PasswordInput } from '@/components/password-input'
import { canUseTenantApp, errorMessage, homeFor, roleFrom, useAuth } from '@/lib/auth'
import { buildHardcodedOAuthConsentPath } from '@/lib/oauth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      const session = await login(email.trim(), password)
      const role = roleFrom(session)
      if (!canUseTenantApp(role)) {
        signOut()
        toast.error('This portal is for tenant administrators and members.')
        return
      }

      if (role === 'TENANT_ADMIN') {
        navigate(homeFor(role))
        return
      }

      const consentPath = await buildHardcodedOAuthConsentPath()
      navigate(consentPath)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]">
      <section className="portal-hero hidden flex-col justify-between p-10 text-white lg:flex">
        <p className="font-display text-2xl">Taleem AI</p>
        <div className="max-w-lg">
          <p className="text-sm tracking-[0.2em] uppercase opacity-80">Tenant workspace</p>
          <h1 className="font-display mt-3 text-5xl leading-tight">Manage your institution.</h1>
          <p className="mt-4 text-white/80">
            Administrators manage the institution. Members can view and update their own profile.
          </p>
        </div>
        <p className="text-sm text-white/60">Sign in with a tenant administrator or member account.</p>
      </section>

      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="lg:hidden">
            <p className="font-display text-2xl text-primary">Taleem AI</p>
            <p className="text-sm text-muted-foreground">Tenant workspace</p>
          </div>
          <Card className="portal-card">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                Tenant administrators go straight to the workspace. Members authorize application access after
                sign-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    if (e.key === 'Enter') void submit()
                  }}
                />
              </Field>
              <Button className="w-full" disabled={busy || !email || !password} onClick={() => void submit()}>
                {busy ? 'Signing in…' : 'Continue'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Have an invitation?{' '}
                <Link to="/accept-invitation" className="text-primary underline-offset-4 hover:underline">
                  Activate your account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
