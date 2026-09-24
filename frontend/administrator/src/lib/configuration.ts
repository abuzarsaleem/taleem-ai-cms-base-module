import type { TenantConfiguration } from '@/lib/types'
import { EMAIL_PATTERN, isHexColor, optionalText, parseHexColor } from '@/lib/utils'

export type ConfigurationDraft = {
  timezone: string
  locale: string
  dateFormat: string
  currencyCode: string
  brandingName: string
  logoAssetId: string
  logoDarkAssetId: string
  faviconAssetId: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  emailFromName: string
  emailFromAddress: string
  supportEmail: string
}

export function emptyConfigurationDraft(): ConfigurationDraft {
  return {
    timezone: 'Asia/Karachi',
    locale: 'en-PK',
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'PKR',
    brandingName: '',
    logoAssetId: '',
    logoDarkAssetId: '',
    faviconAssetId: '',
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    fontFamily: '',
    emailFromName: '',
    emailFromAddress: '',
    supportEmail: '',
  }
}

export function configurationDraftFrom(row: TenantConfiguration): ConfigurationDraft {
  return {
    timezone: row.timezone,
    locale: row.locale,
    dateFormat: row.dateFormat ?? '',
    currencyCode: row.currencyCode,
    brandingName: row.brandingName ?? '',
    logoAssetId: row.logoAssetId ?? '',
    logoDarkAssetId: row.logoDarkAssetId ?? '',
    faviconAssetId: row.faviconAssetId ?? '',
    primaryColor: row.primaryColor ?? '',
    secondaryColor: row.secondaryColor ?? '',
    accentColor: row.accentColor ?? '',
    fontFamily: row.fontFamily ?? '',
    emailFromName: row.emailFromName ?? '',
    emailFromAddress: row.emailFromAddress ?? '',
    supportEmail: row.supportEmail ?? '',
  }
}

export function configurationTimezoneError(draft: ConfigurationDraft): string | null {
  const value = draft.timezone.trim()
  if (!value) return 'Timezone is required.'
  if (value.length > 100) return 'Timezone must be 100 characters or fewer'
  return null
}

export function configurationLocaleError(draft: ConfigurationDraft): string | null {
  const value = draft.locale.trim()
  if (!value) return 'Locale is required.'
  if (value.length > 20) return 'Locale must be 20 characters or fewer'
  return null
}

export function configurationDateFormatError(draft: ConfigurationDraft): string | null {
  const value = draft.dateFormat.trim()
  if (!value) return 'Date format is required.'
  if (value.length > 30) return 'Date format must be 30 characters or fewer'
  return null
}

export function validateConfiguration(draft: ConfigurationDraft) {
  const errors = configurationFieldErrors(draft)
  return Object.values(errors)[0] ?? null
}

export function configurationFieldErrors(draft: ConfigurationDraft) {
  const errors: Partial<Record<keyof ConfigurationDraft, string>> = {}
  const timezoneError = configurationTimezoneError(draft)
  if (timezoneError) errors.timezone = timezoneError
  const localeError = configurationLocaleError(draft)
  if (localeError) errors.locale = localeError
  const dateFormatError = configurationDateFormatError(draft)
  if (dateFormatError) errors.dateFormat = dateFormatError
  if (draft.currencyCode.trim() && draft.currencyCode.trim().length > 3) {
    errors.currencyCode = 'Currency code must be 3 characters'
  }
  if (draft.brandingName.trim().length > 255) {
    errors.brandingName = 'Branding name must be 255 characters or fewer'
  }
  if (draft.primaryColor.trim() && !isHexColor(draft.primaryColor.trim())) {
    errors.primaryColor = 'Primary color must be a hex color like #1A73E8'
  }
  if (draft.secondaryColor.trim() && !isHexColor(draft.secondaryColor.trim())) {
    errors.secondaryColor = 'Secondary color must be a hex color like #1A73E8'
  }
  if (draft.accentColor.trim() && !isHexColor(draft.accentColor.trim())) {
    errors.accentColor = 'Accent color must be a hex color like #1A73E8'
  }
  if (draft.logoAssetId.trim().length > 36) errors.logoAssetId = 'Logo asset id is invalid'
  if (draft.logoDarkAssetId.trim().length > 36) errors.logoDarkAssetId = 'Dark logo asset id is invalid'
  if (draft.faviconAssetId.trim().length > 36) errors.faviconAssetId = 'Favicon asset id is invalid'
  if (draft.emailFromAddress.trim() && !EMAIL_PATTERN.test(draft.emailFromAddress.trim())) {
    errors.emailFromAddress = 'From email must be a valid address'
  }
  if (draft.supportEmail.trim() && !EMAIL_PATTERN.test(draft.supportEmail.trim())) {
    errors.supportEmail = 'Support email must be a valid address'
  }
  return errors
}

function uuidOrUndefined(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

export function configurationPayload(draft: ConfigurationDraft) {
  return {
    timezone: draft.timezone.trim(),
    locale: draft.locale.trim(),
    dateFormat: draft.dateFormat.trim(),
    currencyCode: optionalText(draft.currencyCode) ?? 'PKR',
    brandingName: optionalText(draft.brandingName),
    logoAssetId: uuidOrUndefined(draft.logoAssetId),
    logoDarkAssetId: uuidOrUndefined(draft.logoDarkAssetId),
    faviconAssetId: uuidOrUndefined(draft.faviconAssetId),
    primaryColor: parseHexColor(draft.primaryColor) ?? undefined,
    secondaryColor: parseHexColor(draft.secondaryColor) ?? undefined,
    accentColor: parseHexColor(draft.accentColor) ?? undefined,
    fontFamily: optionalText(draft.fontFamily),
    emailFromName: optionalText(draft.emailFromName),
    emailFromAddress: optionalText(draft.emailFromAddress),
    supportEmail: optionalText(draft.supportEmail),
  }
}
