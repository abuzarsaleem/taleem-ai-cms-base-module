import { SmtpEncryption, type TenantSmtp } from '@/lib/types'
import { EMAIL_PATTERN, optionalText } from '@/lib/utils'

export type SmtpDraft = {
  host: string
  port: string
  username: string
  passwordSecretRef: string
  encryption: SmtpEncryption
  fromName: string
  fromEmail: string
  replyToEmail: string
  isActive: boolean
}

export function emptySmtpDraft(): SmtpDraft {
  return {
    host: '',
    port: '587',
    username: '',
    passwordSecretRef: '',
    encryption: SmtpEncryption.TLS,
    fromName: '',
    fromEmail: '',
    replyToEmail: '',
    isActive: true,
  }
}

const SMTP_HOST_LABEL = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
const SMTP_IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/

export const INVALID_SMTP_HOST_MESSAGE =
  "Invalid hostname format. Special characters like '_', '://', and '@' are not allowed."

export const SECRET_REFERENCE_PATTERN = /^(secret|vault):\/\/[^\s/][^\s]*$/
export const INVALID_SECRET_REFERENCE_MESSAGE =
  'Invalid format. Please enter a valid secret reference path.'

export function isValidSmtpHost(host: string): boolean {
  const trimmed = host.trim()
  if (!trimmed || trimmed.length > 255) return false
  if (/^localhost$/i.test(trimmed)) return true
  if (SMTP_IPV4.test(trimmed)) return true
  const labels = trimmed.split('.')
  return labels.length > 0 && labels.every((label) => SMTP_HOST_LABEL.test(label))
}

export function smtpHostError(draft: SmtpDraft): string | null {
  const host = draft.host.trim()
  if (!host) return null
  return isValidSmtpHost(host) ? null : INVALID_SMTP_HOST_MESSAGE
}

export function smtpPasswordSecretRefError(draft: SmtpDraft): string | null {
  const value = draft.passwordSecretRef.trim()
  if (!value) return null
  if (!SECRET_REFERENCE_PATTERN.test(value)) return INVALID_SECRET_REFERENCE_MESSAGE
  return null
}

export function smtpDraftFrom(row: TenantSmtp): SmtpDraft {
  return {
    host: row.host,
    port: String(row.port),
    username: row.username ?? '',
    passwordSecretRef: row.passwordSecretRef ?? '',
    encryption: row.encryption,
    fromName: row.fromName ?? '',
    fromEmail: row.fromEmail ?? '',
    replyToEmail: row.replyToEmail ?? '',
    isActive: row.isActive,
  }
}

export function validateSmtp(draft: SmtpDraft) {
  const errors = smtpFieldErrors(draft)
  return Object.values(errors)[0] ?? null
}

export function smtpFieldErrors(draft: SmtpDraft) {
  const errors: Partial<Record<keyof SmtpDraft, string>> = {}
  if (!draft.host.trim()) errors.host = 'SMTP host is required'
  else if (draft.host.trim().length > 255) errors.host = 'Host must be 255 characters or fewer'
  else {
    const hostError = smtpHostError(draft)
    if (hostError) errors.host = hostError
  }
  const port = Number(draft.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.port = 'Port must be between 1 and 65535'
  }
  if (draft.username.trim().length > 255) errors.username = 'Username must be 255 characters or fewer'
  if (draft.passwordSecretRef.trim().length > 500) {
    errors.passwordSecretRef = 'Password secret reference must be 500 characters or fewer'
  } else {
    const secretRefError = smtpPasswordSecretRefError(draft)
    if (secretRefError) errors.passwordSecretRef = secretRefError
  }
  if (draft.fromName.trim().length > 255) errors.fromName = 'From name must be 255 characters or fewer'
  if (draft.fromEmail.trim() && !EMAIL_PATTERN.test(draft.fromEmail.trim())) {
    errors.fromEmail = 'From email must be a valid address'
  }
  if (draft.replyToEmail.trim() && !EMAIL_PATTERN.test(draft.replyToEmail.trim())) {
    errors.replyToEmail = 'Reply-to email must be a valid address'
  }
  return errors
}

export function smtpPayload(draft: SmtpDraft) {
  return {
    host: draft.host.trim(),
    port: Number(draft.port),
    username: optionalText(draft.username),
    passwordSecretRef: optionalText(draft.passwordSecretRef),
    encryption: draft.encryption,
    fromName: optionalText(draft.fromName),
    fromEmail: optionalText(draft.fromEmail),
    replyToEmail: optionalText(draft.replyToEmail),
    isActive: draft.isActive,
  }
}
