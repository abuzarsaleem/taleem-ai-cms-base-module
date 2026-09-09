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

export function validateIdentifier(draft: IdentifierDraft) {
  if (!draft.identifierType.trim()) return 'Identifier type is required'
  if (draft.identifierType.trim().length < 2 || draft.identifierType.trim().length > 50) {
    return 'Identifier type must be 2 to 50 characters'
  }
  if (!draft.identifierValue.trim()) return 'Identifier value is required'
  if (draft.identifierValue.trim().length > 150) return 'Identifier value must be 150 characters or fewer'
  if (draft.issuingAuthority.trim().length > 150) return 'Issuing authority must be 150 characters or fewer'
  return null
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
