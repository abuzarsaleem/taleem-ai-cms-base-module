import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/field'
import { validateAcceptInvitation } from '@/lib/account'
import { errorMessage } from '@/lib/auth'
import { authService } from '@/services/account'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const tokenFromLink = Boolean(searchParams.get('token')?.trim())

  useEffect(() => {
    const fromLink = searchParams.get('token')?.trim()
    if (fromLink) setToken(fromLink)
  }, [searchParams])

  async function submit() {
    const error = validateAcceptInvitation({ token, fullName, password, confirmPassword })
    if (error) {
      toast.error(error)
      return
    }
    setBusy(true)
    try {
      const result = await authService.acceptInvitation({
        token: token.trim(),
        password,
        fullName: fullName.trim(),
      })
      toast.success(result.message || 'Password saved. Please sign in.')
      navigate('/login', {
        replace: true,
        state: {
          notice: result.message || 'Password saved. Sign in with your email and password.',
          email: result.email,
        },
      })
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="portal-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Create a password to join the institution. After saving, you will sign in on the next
            screen — this link does not log you in automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenFromLink ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Invitation token received from your email link.
            </p>
          ) : (
            <Field
              label="Invitation token"
              required
              hint="Paste the token from the invite email or the one-time copy shown after send."
            >
              <Input value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
            </Field>
          )}
          <Field label="Full name" required>
            <Input
              value={fullName}
              maxLength={150}
              autoComplete="name"
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Password" required hint="At least 8 characters.">
            <Input
              type="password"
              value={password}
              maxLength={128}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm password" required>
            <Input
              type="password"
              value={confirmPassword}
              maxLength={128}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
          </Field>
          <Button className="w-full" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Saving…' : 'Save password'}
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
