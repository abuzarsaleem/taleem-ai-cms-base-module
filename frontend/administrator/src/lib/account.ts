import { EMAIL_PATTERN } from '@/lib/utils'
import type { AuthTokenResponse, AuthUser, UserProfile } from '@/lib/types'

export function authUserFrom(
  user: AuthTokenResponse['user'] | UserProfile,
  fallback?: AuthUser,
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles ?? fallback?.roles ?? [],
    permissions: user.permissions ?? fallback?.permissions ?? [],
    emailVerified: user.emailVerified ?? fallback?.emailVerified,
    avatarUrl: user.avatarUrl,
    status: 'status' in user ? user.status : fallback?.status,
  }
}

export function validateProfileDraft(fullName: string, email: string) {
  if (!fullName.trim()) return 'Full name is required'
  if (fullName.trim().length > 150) return 'Full name must be 150 characters or fewer'
  if (!email.trim()) return 'Email is required'
  if (email.trim().length > 150) return 'Email must be 150 characters or fewer'
  if (!EMAIL_PATTERN.test(email.trim())) return 'Email must be a valid address'
  return null
}

export function validatePasswordChange(currentPassword: string, newPassword: string, confirmPassword: string) {
  if (!currentPassword) return 'Current password is required'
  if (currentPassword.length < 8 || currentPassword.length > 128) {
    return 'Current password must be 8 to 128 characters'
  }
  if (newPassword.length < 8) return 'New password must be at least 8 characters'
  if (newPassword.length > 128) return 'New password must be 128 characters or fewer'
  if (newPassword === currentPassword) return 'New password must be different from the current password'
  if (newPassword !== confirmPassword) return 'New passwords do not match'
  return null
}

export function validateAvatarFile(file: File) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  if (!allowed.has(file.type)) return 'Use a JPEG, PNG, WebP, or GIF image'
  if (file.size > 5_242_880) return 'Image must be 5MB or smaller'
  return null
}

export function validateAcceptInvitation(input: {
  token: string
  fullName: string
  password: string
  confirmPassword: string
}) {
  if (input.token.trim().length < 16) return 'Invitation token is required'
  if (input.token.trim().length > 512) return 'Invitation token is too long'
  if (!input.fullName.trim()) return 'Full name is required'
  if (input.fullName.trim().length > 150) return 'Full name must be 150 characters or fewer'
  if (input.password.length < 8) return 'Password must be at least 8 characters'
  if (input.password.length > 128) return 'Password must be 128 characters or fewer'
  if (input.password !== input.confirmPassword) return 'Passwords do not match'
  return null
}
