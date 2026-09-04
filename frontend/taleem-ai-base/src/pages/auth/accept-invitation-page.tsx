import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const { completeAuth, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const fromLink = searchParams.get('token')?.trim()
    if (fromLink) setToken(fromLink)
  }, [searchParams])

  function validate() {
    if (token.trim().length < 16) return 'Invitation token is required'
    if (token.trim().length > 512) return 'Invitation token is too long'
    if (!fullName.trim()) return 'Full name is required'
    if (fullName.trim().length > 150) return 'Full name must be 150 characters or fewer'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password.length > 128) return 'Password must be 128 characters or fewer'
    return null
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="portal-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept invitation</CardTitle>
          <CardDescription>
            POST /auth/accept-invitation — token from the invite email or the one-time token shown after send or
            resend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Invitation token" required hint="Filled automatically when you open the invite link.">
            <Input value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Full name" required>
            <Input value={fullName} maxLength={150} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Password" required hint="At least 8 characters.">
            <Input type="password" value={password} maxLength={128} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => {
              const error = validate()
              if (error) {
                toast.error(error)
                return
              }
              setBusy(true)
              apiRequest<{ accessToken: string; user: AuthUser }>('/auth/accept-invitation', {
                method: 'POST',
                token: null,
                body: { token: token.trim(), password, fullName: fullName.trim() },
              })
                .then(async (result) => {
                  const session = await completeAuth(result.accessToken, result.user)
                  const role = roleFrom(session)
                  toast.success('Invitation accepted')
                  if (role) {
                    navigate(homeFor(role))
                    return
                  }
                  signOut()
                  toast.message('This workspace is for tenant administrators. Sign in when you have that role.')
                  navigate('/login')
                })
                .catch((error) => toast.error(errorMessage(error)))
                .finally(() => setBusy(false))
            }}
          >
            {busy ? 'Activating…' : 'Activate account'}
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
