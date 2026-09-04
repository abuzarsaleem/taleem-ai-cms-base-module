import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '@app/common';
import { AddressType, AssetType, ContactType } from '../../../domain/tenant.types.js';

function toOptionalBoolean({ value }: { value: unknown }): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

export class PlatformContactQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: ContactType })
  @IsOptional()
  @IsEnum(ContactType)
  contactType?: ContactType;

  @ApiPropertyOptional({ example: 'admin@university.edu' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Search first/last/middle name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isPrimary?: boolean;
}

export class PlatformAddressQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: AddressType })
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'PK' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class PlatformIdentifierQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'REGISTRATION' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identifierType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  identifierValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isVerified?: boolean;
}

export class PlatformConfigurationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'Asia/Karachi' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: 'en-PK' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @ApiPropertyOptional({ example: 'PKR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;
}

export class PlatformSmtpQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  host?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class PlatformAssetQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;
}

export type PlatformContactFilters = Omit<PlatformContactQueryDto, 'page' | 'limit'>;
export type PlatformAddressFilters = Omit<PlatformAddressQueryDto, 'page' | 'limit'>;
export type PlatformIdentifierFilters = Omit<PlatformIdentifierQueryDto, 'page' | 'limit'>;
export type PlatformConfigurationFilters = Omit<PlatformConfigurationQueryDto, 'page' | 'limit'>;
export type PlatformSmtpFilters = Omit<PlatformSmtpQueryDto, 'page' | 'limit'>;
export type PlatformAssetFilters = Omit<PlatformAssetQueryDto, 'page' | 'limit'>;
