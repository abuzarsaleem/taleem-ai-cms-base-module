import { AssetType, type TenantAsset } from '@/lib/types'
import { optionalText } from '@/lib/utils'

export type AssetDraft = {
  assetType: AssetType
  fileUrl: string
  fileName: string
  contentType: string
}

export function emptyAssetDraft(): AssetDraft {
  return {
    assetType: AssetType.LOGO,
    fileUrl: '',
    fileName: '',
    contentType: '',
  }
}

export function assetDraftFrom(row: TenantAsset): AssetDraft {
  return {
    assetType: row.assetType,
    fileUrl: row.fileUrl,
    fileName: row.fileName ?? '',
    contentType: row.contentType ?? '',
  }
}

export function validateAssetUrl(draft: AssetDraft, requireUrl = true) {
  if (!draft.assetType) return 'Asset type is required'
  if (!Object.values(AssetType).includes(draft.assetType)) return 'Asset type is invalid'
  if (requireUrl && !draft.fileUrl.trim()) return 'File URL is required'
  if (draft.fileUrl.trim()) {
    if (!/^https?:\/\//i.test(draft.fileUrl.trim())) return 'File URL must start with http:// or https://'
    if (draft.fileUrl.trim().length > 1000) return 'File URL must be 1000 characters or fewer'
  }
  if (draft.fileName.trim().length > 255) return 'File name must be 255 characters or fewer'
  if (draft.contentType.trim().length > 100) return 'Content type must be 100 characters or fewer'
  return null
}

export function assetPayload(draft: AssetDraft, originalUrl?: string) {
  const payload: Record<string, unknown> = {
    assetType: draft.assetType,
    fileName: optionalText(draft.fileName),
    contentType: optionalText(draft.contentType),
  }
  const fileUrl = draft.fileUrl.trim()
  if (!originalUrl || fileUrl !== originalUrl) payload.fileUrl = fileUrl
  return payload
}
