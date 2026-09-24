import type { TenantIdentifier } from '@/lib/types'
import { dateInputValue, optionalText } from '@/lib/utils'

export type IdentifierDraft = {
  identifierType: string
  identifierValue: string
  issuingAuthority: string
  issueDate: string
  expiryDate: string
  isVerified: boolean
}

export function emptyIdentifierDraft(): IdentifierDraft {
  return {
    identifierType: 'REGISTRATION',
    identifierValue: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    isVerified: false,
  }
}

export function identifierDraftFrom(row: TenantIdentifier): IdentifierDraft {
  return {
    identifierType: row.identifierType,
    identifierValue: row.identifierValue,
    issuingAuthority: row.issuingAuthority ?? '',
    issueDate: dateInputValue(row.issueDate),
    expiryDate: dateInputValue(row.expiryDate),
    isVerified: row.isVerified,
  }
}

function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function minExpiryDate(issueDate: string): string | undefined {
  const trimmed = issueDate.trim()
  if (!trimmed) return undefined
  return shiftIsoDate(trimmed, 1)
}

export function maxIssueDate(expiryDate: string): string | undefined {
  const trimmed = expiryDate.trim()
  if (!trimmed) return undefined
  return shiftIsoDate(trimmed, -1)
}

export function identifierDateRangeError(draft: IdentifierDraft): string | null {
  const issueDate = draft.issueDate.trim()
  const expiryDate = draft.expiryDate.trim()
  if (!issueDate || !expiryDate) return null
  if (expiryDate <= issueDate) return 'Expiry date must be later than the issue date.'
  return null
}

export function validateIdentifier(draft: IdentifierDraft) {
  const errors = identifierFieldErrors(draft)
  return Object.values(errors)[0] ?? null
}

export function identifierFieldErrors(draft: IdentifierDraft) {
  const errors: Partial<Record<keyof IdentifierDraft, string>> = {}
  if (!draft.identifierType.trim()) errors.identifierType = 'Identifier type is required'
  else if (draft.identifierType.trim().length < 2 || draft.identifierType.trim().length > 50) {
    errors.identifierType = 'Identifier type must be 2 to 50 characters'
  }
  if (!draft.identifierValue.trim()) errors.identifierValue = 'Identifier value is required'
  else if (draft.identifierValue.trim().length > 150) {
    errors.identifierValue = 'Identifier value must be 150 characters or fewer'
  }
  if (draft.issuingAuthority.trim().length > 150) {
    errors.issuingAuthority = 'Issuing authority must be 150 characters or fewer'
  }
  const dateError = identifierDateRangeError(draft)
  if (dateError) errors.expiryDate = dateError
  return errors
}

export function identifierPayload(draft: IdentifierDraft, mode: 'create' | 'update') {
  const payload: Record<string, unknown> = {
    identifierType: draft.identifierType.trim(),
    identifierValue: draft.identifierValue.trim(),
    issuingAuthority: optionalText(draft.issuingAuthority),
    issueDate: optionalText(draft.issueDate),
    expiryDate: optionalText(draft.expiryDate),
  }
  if (mode === 'update') payload.isVerified = draft.isVerified
  return payload
}
