import { ContactType, type TenantContact } from '@/lib/types'
import { EMAIL_PATTERN, optionalText } from '@/lib/utils'

export type ContactDraft = {
  contactType: ContactType
  firstName: string
  middleName: string
  lastName: string
  designation: string
  department: string
  responsibility: string
  email: string
  mobilePhone: string
  landlinePhone: string
  whatsappNumber: string
  isPrimary: boolean
  isActive: boolean
}

export function emptyContactDraft(overrides: Partial<ContactDraft> = {}): ContactDraft {
  return {
    contactType: ContactType.PRIMARY,
    firstName: '',
    middleName: '',
    lastName: '',
    designation: '',
    department: '',
    responsibility: '',
    email: '',
    mobilePhone: '',
    landlinePhone: '',
    whatsappNumber: '',
    isPrimary: false,
    isActive: true,
    ...overrides,
  }
}

function optional(value: string) {
  return optionalText(value)
}

const EMAIL = EMAIL_PATTERN
const OPTIONAL_PHONE_CHARS = /^[\d+\s().-]+$/
export const INVALID_PHONE_MESSAGE = 'Please enter a valid phone number.'

function optionalPhoneError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!OPTIONAL_PHONE_CHARS.test(trimmed)) return INVALID_PHONE_MESSAGE
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return INVALID_PHONE_MESSAGE
  return null
}

export function contactMobilePhoneError(draft: ContactDraft): string | null {
  return optionalPhoneError(draft.mobilePhone)
}

export function contactWhatsappNumberError(draft: ContactDraft): string | null {
  return optionalPhoneError(draft.whatsappNumber)
}

export function contactEmailError(draft: ContactDraft): string | null {
  const email = draft.email.trim()
  if (!email) return 'Email is required.'
  if (!EMAIL.test(email)) return 'Email must be a valid address'
  if (email.length > 255) return 'Email must be 255 characters or fewer'
  return null
}

export function validateContact(draft: ContactDraft): string | null {
  if (!draft.contactType) return 'Contact type is required'
  if (!Object.values(ContactType).includes(draft.contactType)) return 'Contact type is invalid'
  if (!draft.firstName.trim()) return 'First name is required'
  if (draft.firstName.trim().length > 100) return 'First name must be 100 characters or fewer'
  if (draft.middleName.trim().length > 100) return 'Middle name must be 100 characters or fewer'
  if (draft.lastName.trim().length > 100) return 'Last name must be 100 characters or fewer'
  if (draft.designation.trim().length > 150) return 'Designation must be 150 characters or fewer'
  if (draft.department.trim().length > 150) return 'Department must be 150 characters or fewer'
  if (draft.responsibility.trim().length > 500) return 'Responsibility must be 500 characters or fewer'
  const emailError = contactEmailError(draft)
  if (emailError) return emailError
  if (draft.mobilePhone.trim().length > 30) return 'Mobile phone must be 30 characters or fewer'
  const mobilePhoneError = contactMobilePhoneError(draft)
  if (mobilePhoneError) return mobilePhoneError
  if (draft.landlinePhone.trim().length > 30) return 'Landline must be 30 characters or fewer'
  if (draft.whatsappNumber.trim().length > 30) return 'WhatsApp number must be 30 characters or fewer'
  return contactWhatsappNumberError(draft)
}

export function contactDraftFrom(contact: TenantContact): ContactDraft {
  return {
    contactType: contact.contactType,
    firstName: contact.firstName,
    middleName: contact.middleName ?? '',
    lastName: contact.lastName ?? '',
    designation: contact.designation ?? '',
    department: contact.department ?? '',
    responsibility: contact.responsibility ?? '',
    email: contact.email ?? '',
    mobilePhone: contact.mobilePhone ?? '',
    landlinePhone: contact.landlinePhone ?? '',
    whatsappNumber: contact.whatsappNumber ?? '',
    isPrimary: contact.isPrimary,
    isActive: contact.isActive,
  }
}

export function contactPayload(draft: ContactDraft) {
  return {
    contactType: draft.contactType,
    firstName: draft.firstName.trim(),
    middleName: optional(draft.middleName),
    lastName: optional(draft.lastName),
    designation: optional(draft.designation),
    department: optional(draft.department),
    responsibility: optional(draft.responsibility),
    email: draft.email.trim().toLowerCase(),
    mobilePhone: optional(draft.mobilePhone),
    landlinePhone: optional(draft.landlinePhone),
    whatsappNumber: optional(draft.whatsappNumber),
    isPrimary: draft.isPrimary,
    isActive: draft.isActive,
  }
}
