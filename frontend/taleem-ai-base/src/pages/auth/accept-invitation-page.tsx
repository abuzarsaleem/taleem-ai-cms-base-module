import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/field'
import { errorMessage, homeFor, roleFrom, useAuth } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import type { AuthUser } from '@/lib/types'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [token, setToken] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="portal-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept administrator invitation</CardTitle>
          <CardDescription>Set a password for the invited tenant administrator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Invitation token" hint="In production this comes from the email link.">
            <Input value={token} onChange={(e) => setToken(e.target.value)} />
          </Field>
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              apiRequest<{ accessToken: string; user: AuthUser }>('/auth/accept-invitation', {
                method: 'POST',
                token: null,
                body: { token, password, fullName },
              })
                .then((result) => {
                  const session = { accessToken: result.accessToken, user: result.user }
                  signIn(session)
                  const role = roleFrom(result.user) ?? 'TENANT_ADMIN'
                  toast.success('Invitation accepted')
                  navigate(homeFor(role))
                })
                .catch((error) => toast.error(errorMessage(error)))
                .finally(() => setBusy(false))
            }}
          >
            Activate account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have access?{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
