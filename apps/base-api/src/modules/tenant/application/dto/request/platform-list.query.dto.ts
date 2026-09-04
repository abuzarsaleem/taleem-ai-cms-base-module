import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '@app/common';
import {
  AddressType,
  AssetType,
  ContactType,
  DeploymentModel,
  TenantStatus,
} from '../../../domain/tenant.types.js';

const UUID_LIKE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function toOptionalBoolean({ value }: { value: unknown }): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}

export class PlatformTenantQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({ enum: DeploymentModel })
  @IsOptional()
  @IsEnum(DeploymentModel)
  deploymentModel?: DeploymentModel;

  @ApiPropertyOptional({ example: 'uol-lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tenantCode?: string;

  @ApiPropertyOptional({ description: 'Search legal/display name or tenant code' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ example: 'UNIVERSITY' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  institutionType?: string;

  @ApiPropertyOptional({ example: 'PK' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}

export class PlatformContactQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
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
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
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
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
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
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
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
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
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
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
  tenantId?: string;

  @ApiPropertyOptional({ enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;
}

export type PlatformTenantFilters = Omit<PlatformTenantQueryDto, 'page' | 'limit'>;
export type PlatformContactFilters = Omit<PlatformContactQueryDto, 'page' | 'limit'>;
export type PlatformAddressFilters = Omit<PlatformAddressQueryDto, 'page' | 'limit'>;
export type PlatformIdentifierFilters = Omit<PlatformIdentifierQueryDto, 'page' | 'limit'>;
export type PlatformConfigurationFilters = Omit<PlatformConfigurationQueryDto, 'page' | 'limit'>;
export type PlatformSmtpFilters = Omit<PlatformSmtpQueryDto, 'page' | 'limit'>;
export type PlatformAssetFilters = Omit<PlatformAssetQueryDto, 'page' | 'limit'>;
