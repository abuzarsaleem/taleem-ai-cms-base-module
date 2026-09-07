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
  const email = draft.email.trim()
  if (email && !EMAIL.test(email)) return 'Email must be a valid address'
  if (email.length > 255) return 'Email must be 255 characters or fewer'
  if (draft.mobilePhone.trim().length > 30) return 'Mobile phone must be 30 characters or fewer'
  if (draft.landlinePhone.trim().length > 30) return 'Landline must be 30 characters or fewer'
  if (draft.whatsappNumber.trim().length > 30) return 'WhatsApp number must be 30 characters or fewer'
  return null
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
    email: optional(draft.email),
    mobilePhone: optional(draft.mobilePhone),
    landlinePhone: optional(draft.landlinePhone),
    whatsappNumber: optional(draft.whatsappNumber),
    isPrimary: draft.isPrimary,
    isActive: draft.isActive,
  }
}
