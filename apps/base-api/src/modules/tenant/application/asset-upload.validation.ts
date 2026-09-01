import { BadRequestException } from '@nestjs/common';
import { AssetType } from '../domain/tenant.types.js';
import type { UploadedAssetFile } from './uploaded-asset-file.js';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const DOCUMENT_MIME_TYPES = new Set(['application/pdf']);

const IMAGE_ASSET_TYPES = new Set([
  AssetType.LOGO,
  AssetType.LOGO_DARK,
  AssetType.FAVICON,
  AssetType.BANNER,
]);

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

export function assertValidAssetUpload(
  file: UploadedAssetFile | undefined,
  assetType: AssetType,
  maxImageBytes: number,
  maxDocumentBytes: number,
): void {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  if (!file.buffer?.length) {
    throw new BadRequestException('Uploaded file is empty');
  }

  const isDocument = assetType === AssetType.DOCUMENT;
  const allowedTypes = isDocument ? DOCUMENT_MIME_TYPES : IMAGE_MIME_TYPES;
  const maxBytes = isDocument ? maxDocumentBytes : maxImageBytes;

  if (!isDocument && !IMAGE_ASSET_TYPES.has(assetType)) {
    throw new BadRequestException(`Asset type '${assetType}' requires an image upload`);
  }

  if (!allowedTypes.has(file.mimetype)) {
    throw new BadRequestException(
      isDocument
        ? 'Only PDF documents are allowed for DOCUMENT assets'
        : 'Only JPEG, PNG, WebP, GIF, and SVG images are allowed',
    );
  }

  if (file.size > maxBytes) {
    throw new BadRequestException(
      `File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))}MB`,
    );
  }
}

export function extensionForMimeType(mimeType: string): string {
  return MIME_EXTENSION[mimeType] ?? 'bin';
}

export function sanitizeOriginalName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 200);
}
