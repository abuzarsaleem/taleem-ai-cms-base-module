import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Field } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { errorMessage, useAuth } from '@/lib/auth'
import {
  validateAvatarFile,
  validatePasswordChange,
  validateProfileDraft,
} from '@/lib/account'
import { initialsFromName, isDisplayableImageUrl } from '@/lib/utils'
import type { UserProfile } from '@/lib/types'
import { userProfileService } from '@/services/account'

export function AccountPage() {
  const { session, applyProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const roleLabel = 'Platform administrator'
  const initials = initialsFromName(fullName || session?.user.fullName || '')
  const avatarSrc = avatarPreview || profile?.avatarUrl || session?.user.avatarUrl

  useEffect(() => {
    let cancelled = false
    userProfileService
      .get()
      .then((next) => {
        if (cancelled) return
        setProfile(next)
        setFullName(next.fullName)
        setEmail(next.email)
        applyProfile(next)
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applyProfile])

  async function saveProfile() {
    const error = validateProfileDraft(fullName, email)
    if (error) {
      toast.error(error)
      return
    }
    setSavingProfile(true)
    try {
      const next = await userProfileService.update({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      })
      setProfile(next)
      setFullName(next.fullName)
      setEmail(next.email)
      applyProfile(next)
      toast.success(
        next.email !== profile?.email && !next.emailVerified
          ? 'Profile updated. Check your inbox to verify the new email.'
          : 'Profile updated',
      )
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword() {
    const error = validatePasswordChange(currentPassword, newPassword, confirmPassword)
    if (error) {
      toast.error(error)
      return
    }
    setSavingPassword(true)
    try {
      const result = await userProfileService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success(result.message || 'Password changed')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSavingPassword(false)
    }
  }

  async function onPickAvatar(file: File | undefined) {
    if (!file) return
    const error = validateAvatarFile(file)
    if (error) {
      toast.error(error)
      return
    }
    setSavingAvatar(true)
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    try {
      const next = await userProfileService.uploadAvatar(file)
      setProfile(next)
      applyProfile(next)
      toast.success('Profile picture updated')
      if (isDisplayableImageUrl(next.avatarUrl)) {
        URL.revokeObjectURL(preview)
        setAvatarPreview(null)
      }
    } catch (caught) {
      URL.revokeObjectURL(preview)
      setAvatarPreview(null)
      toast.error(errorMessage(caught))
    } finally {
      setSavingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removeAvatar() {
    setSavingAvatar(true)
    try {
      const next = await userProfileService.removeAvatar()
      setProfile(next)
      applyProfile(next)
      setAvatarPreview(null)
      toast.success('Profile picture removed')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSavingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-80 rounded-[var(--radius)]" />
          <Skeleton className="h-80 rounded-[var(--radius)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Name, email, password, and profile picture for this administrator account."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              {roleLabel}
              {profile?.status ? ` · ${profile.status.replaceAll('_', ' ').toLowerCase()}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-16 overflow-hidden">
                {isDisplayableImageUrl(avatarSrc) ? (
                  <img src={avatarSrc} alt={fullName} className="size-full rounded-full object-cover" />
                ) : (
                  <AvatarFallback className="text-base">{initials || 'U'}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void onPickAvatar(event.target.files?.[0])}
                />
                <Button variant="outline" disabled={savingAvatar} onClick={() => fileRef.current?.click()}>
                  {savingAvatar ? 'Uploading…' : 'Upload picture'}
                </Button>
                {isDisplayableImageUrl(avatarSrc) ? (
                  <Button variant="outline" disabled={savingAvatar} onClick={() => void removeAvatar()}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
            <Field label="Full name" required>
              <Input value={fullName} maxLength={150} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field
              label="Email"
              required
              hint={
                profile && email.trim().toLowerCase() !== profile.email
                  ? 'Changing email sends a verification message and marks this address unverified.'
                  : undefined
              }
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  className="flex-1"
                  type="email"
                  value={email}
                  maxLength={150}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {profile ? (
                  <p className="text-xs text-muted-foreground">
                    {profile.emailVerified ? 'Email verified' : 'Email not verified'}
                  </p>
                ) : null}
              </div>
            </Field>
          </CardContent>
          <CardFooter>
            <Button disabled={savingProfile} onClick={() => void saveProfile()}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Use the current password, then choose a new one with at least 8 characters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Current password" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                maxLength={128}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>
            <Field label="New password" required>
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                maxLength={128}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm new password" required>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                maxLength={128}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void savePassword()
                }}
              />
            </Field>
          </CardContent>
          <CardFooter>
            <Button disabled={savingPassword} onClick={() => void savePassword()}>
              {savingPassword ? 'Updating…' : 'Change password'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
