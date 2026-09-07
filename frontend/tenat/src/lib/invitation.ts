import { EMAIL_PATTERN } from '@/lib/utils'
import { InvitationStatus, type AdminInvitation } from '@/lib/types'

export function validateInvitationEmail(email: string) {
  const trimmed = email.trim()
  if (!trimmed) return 'Email is required'
  if (trimmed.length > 255) return 'Email must be 255 characters or fewer'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Email must be a valid address'
  return null
}

export function invitationPayload(email: string) {
  return { email: email.trim().toLowerCase() }
}

export function invitationAcceptPath(token: string) {
  return `/accept-invitation?token=${encodeURIComponent(token)}`
}

export function invitationAcceptUrl(token: string) {
  return `${window.location.origin}${invitationAcceptPath(token)}`
}

export function invitationIsPending(row: AdminInvitation) {
  if (row.status !== InvitationStatus.PENDING) return false
  return new Date(row.expiresAt).getTime() > Date.now()
}

export function formatInvitationInstant(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}
