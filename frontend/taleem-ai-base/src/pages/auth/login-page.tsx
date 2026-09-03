import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/field'
import { errorMessage, homeFor, roleFrom, useAuth } from '@/lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      const session = await login(email.trim(), password)
      const role = roleFrom(session.user)
      if (!role) {
        toast.error('This account has no platform or tenant administrator role')
        return
      }
      if (role !== 'PLATFORM_ADMIN') {
        toast.message('Tenant administrator workspace is next. Platform administration is ready now.')
      }
      navigate(homeFor(role))
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
          <p className="text-sm tracking-[0.2em] uppercase opacity-80">CMS Base Platform</p>
          <h1 className="font-display mt-3 text-5xl leading-tight">One foundation for every institution.</h1>
          <p className="mt-4 text-white/80">
            Identity, tenant onboarding, subscriptions, and application access — without mixing application
            business logic into the platform.
          </p>
        </div>
        <p className="text-sm text-white/60">Sign in with a platform administrator account.</p>
      </section>

      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="lg:hidden">
            <p className="font-display text-2xl text-primary">Taleem AI</p>
            <p className="text-sm text-muted-foreground">CMS Base Platform</p>
          </div>
          <Card className="portal-card">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Use your platform administrator credentials.</CardDescription>
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
                <Input
                  type="password"
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
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
