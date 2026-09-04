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
  if (!draft.addressType) return 'Address type is required'
  if (!Object.values(AddressType).includes(draft.addressType)) return 'Address type is invalid'
  if (!draft.addressLine1.trim()) return 'Address line 1 is required'
  if (draft.addressLine1.trim().length > 255) return 'Address line 1 must be 255 characters or fewer'
  if (draft.addressLine2.trim().length > 255) return 'Address line 2 must be 255 characters or fewer'
  if (draft.area.trim().length > 150) return 'Area must be 150 characters or fewer'
  if (!draft.city.trim()) return 'City is required'
  if (draft.city.trim().length > 100) return 'City must be 100 characters or fewer'
  if (draft.district.trim().length > 100) return 'District must be 100 characters or fewer'
  if (draft.provinceCode.trim().length > 20) return 'Province must be 20 characters or fewer'
  if (draft.postalCode.trim().length > 20) return 'Postal code must be 20 characters or fewer'
  if (draft.countryCode.trim() && draft.countryCode.trim().length > 2) {
    return 'Country code must be 2 characters'
  }
  return null
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
