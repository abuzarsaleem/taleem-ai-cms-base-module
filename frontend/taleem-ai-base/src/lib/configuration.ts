import type { TenantConfiguration } from '@/lib/types'
import { EMAIL_PATTERN, isHexColor, isUuid, optionalText } from '@/lib/utils'

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

export function validateConfiguration(draft: ConfigurationDraft) {
  if (draft.timezone.trim().length > 100) return 'Timezone must be 100 characters or fewer'
  if (draft.locale.trim().length > 20) return 'Locale must be 20 characters or fewer'
  if (draft.dateFormat.trim().length > 30) return 'Date format must be 30 characters or fewer'
  if (draft.currencyCode.trim() && draft.currencyCode.trim().length > 3) {
    return 'Currency code must be 3 characters'
  }
  if (draft.brandingName.trim().length > 255) return 'Branding name must be 255 characters or fewer'
  for (const [label, value] of [
    ['Primary color', draft.primaryColor],
    ['Secondary color', draft.secondaryColor],
    ['Accent color', draft.accentColor],
  ] as const) {
    if (value.trim() && !isHexColor(value.trim())) return `${label} must be a hex color like #1A73E8`
  }
  for (const [label, value] of [
    ['Logo asset', draft.logoAssetId],
    ['Dark logo asset', draft.logoDarkAssetId],
    ['Favicon asset', draft.faviconAssetId],
  ] as const) {
    if (value.trim() && !isUuid(value)) return `${label} must be an asset UUID`
  }
  if (draft.emailFromAddress.trim() && !EMAIL_PATTERN.test(draft.emailFromAddress.trim())) {
    return 'From email must be a valid address'
  }
  if (draft.supportEmail.trim() && !EMAIL_PATTERN.test(draft.supportEmail.trim())) {
    return 'Support email must be a valid address'
  }
  return null
}

function uuidOrNull(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

export function configurationPayload(draft: ConfigurationDraft) {
  return {
    timezone: optionalText(draft.timezone) ?? 'Asia/Karachi',
    locale: optionalText(draft.locale) ?? 'en-PK',
    dateFormat: optionalText(draft.dateFormat),
    currencyCode: optionalText(draft.currencyCode) ?? 'PKR',
    brandingName: optionalText(draft.brandingName),
    logoAssetId: uuidOrNull(draft.logoAssetId),
    logoDarkAssetId: uuidOrNull(draft.logoDarkAssetId),
    faviconAssetId: uuidOrNull(draft.faviconAssetId),
    primaryColor: optionalText(draft.primaryColor),
    secondaryColor: optionalText(draft.secondaryColor),
    accentColor: optionalText(draft.accentColor),
    fontFamily: optionalText(draft.fontFamily),
    emailFromName: optionalText(draft.emailFromName),
    emailFromAddress: optionalText(draft.emailFromAddress),
    supportEmail: optionalText(draft.supportEmail),
  }
}
