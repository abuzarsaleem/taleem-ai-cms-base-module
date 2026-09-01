import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AssetType } from '../../../domain/tenant.types.js';
import type { UploadedAssetFile } from '../../uploaded-asset-file.js';

export class UploadTenantAssetDto {
  @ApiProperty({ enum: AssetType, example: AssetType.LOGO })
  @IsEnum(AssetType)
  assetType!: AssetType;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Image or PDF file to upload' })
  file!: UploadedAssetFile;
}