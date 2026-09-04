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
  if (!draft.host.trim()) return 'SMTP host is required'
  if (draft.host.trim().length > 255) return 'Host must be 255 characters or fewer'
  const port = Number(draft.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) return 'Port must be between 1 and 65535'
  if (draft.username.trim().length > 255) return 'Username must be 255 characters or fewer'
  if (draft.passwordSecretRef.trim().length > 500) return 'Password secret reference must be 500 characters or fewer'
  if (draft.fromName.trim().length > 255) return 'From name must be 255 characters or fewer'
  if (draft.fromEmail.trim() && !EMAIL_PATTERN.test(draft.fromEmail.trim())) return 'From email must be a valid address'
  if (draft.replyToEmail.trim() && !EMAIL_PATTERN.test(draft.replyToEmail.trim())) {
    return 'Reply-to email must be a valid address'
  }
  return null
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
