import { AddressType, type TenantAddress } from '@/lib/types'
import { optionalText } from '@/lib/utils'

export type AddressDraft = {
  addressType: AddressType
  addressLine1: string
  addressLine2: string
  area: string
  city: string
  district: string
  provinceCode: string
  postalCode: string
  countryCode: string
  isPrimary: boolean
  isActive: boolean
}

export function emptyAddressDraft(): AddressDraft {
  return {
    addressType: AddressType.HEAD_OFFICE,
    addressLine1: '',
    addressLine2: '',
    area: '',
    city: '',
    district: '',
    provinceCode: '',
    postalCode: '',
    countryCode: 'PK',
    isPrimary: false,
    isActive: true,
  }
}

export function addressDraftFrom(address: TenantAddress): AddressDraft {
  return {
    addressType: address.addressType,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? '',
    area: address.area ?? '',
    city: address.city,
    district: address.district ?? '',
    provinceCode: address.provinceCode ?? '',
    postalCode: address.postalCode ?? '',
    countryCode: address.countryCode,
    isPrimary: address.isPrimary,
    isActive: address.isActive,
  }
}

export function validateAddress(draft: AddressDraft) {
  const errors = addressFieldErrors(draft)
  return Object.values(errors)[0] ?? null
}

export function addressFieldErrors(draft: AddressDraft) {
  const errors: Partial<Record<keyof AddressDraft, string>> = {}
  if (!draft.addressType) errors.addressType = 'Address type is required'
  else if (!Object.values(AddressType).includes(draft.addressType)) {
    errors.addressType = 'Address type is invalid'
  }
  if (!draft.addressLine1.trim()) errors.addressLine1 = 'Address line 1 is required'
  else if (draft.addressLine1.trim().length > 255) {
    errors.addressLine1 = 'Address line 1 must be 255 characters or fewer'
  }
  if (draft.addressLine2.trim().length > 255) {
    errors.addressLine2 = 'Address line 2 must be 255 characters or fewer'
  }
  if (draft.area.trim().length > 150) errors.area = 'Area must be 150 characters or fewer'
  if (!draft.city.trim()) errors.city = 'City is required'
  else if (draft.city.trim().length > 100) errors.city = 'City must be 100 characters or fewer'
  if (draft.district.trim().length > 100) errors.district = 'District must be 100 characters or fewer'
  if (draft.provinceCode.trim().length > 20) errors.provinceCode = 'Province must be 20 characters or fewer'
  if (draft.postalCode.trim().length > 20) errors.postalCode = 'Postal code must be 20 characters or fewer'
  if (draft.countryCode.trim() && draft.countryCode.trim().length > 2) {
    errors.countryCode = 'Country code must be 2 characters'
  }
  return errors
}

export function addressPayload(draft: AddressDraft) {
  return {
    addressType: draft.addressType,
    addressLine1: draft.addressLine1.trim(),
    addressLine2: optionalText(draft.addressLine2),
    area: optionalText(draft.area),
    city: draft.city.trim(),
    district: optionalText(draft.district),
    provinceCode: optionalText(draft.provinceCode),
    postalCode: optionalText(draft.postalCode),
    countryCode: optionalText(draft.countryCode) ?? 'PK',
    isPrimary: draft.isPrimary,
    isActive: draft.isActive,
  }
}
