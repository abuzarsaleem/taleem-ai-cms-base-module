import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AddressType,
  AssetType,
  CampusType,
  ContactType,
  DeploymentModel,
  IdentifierType,
  SmtpEncryption,
  TenantStatus,
} from '../../../domain/tenant.types.js';

export class CreateTenantDto {
  @ApiProperty({ example: 'uol-lahore', maxLength: 50 })
  @IsString() @MinLength(2) @MaxLength(50)
  tenantCode!: string;

  @ApiProperty({ example: 'University of Lahore (Private) Limited' })
  @IsString() @MaxLength(255)
  legalName!: string;

  @ApiProperty({ example: 'University of Lahore' })
  @IsString() @MaxLength(255)
  displayName!: string;

  @ApiProperty({ example: 'UNIVERSITY' })
  @IsString() @MaxLength(50)
  institutionType!: string;

  @ApiPropertyOptional({ example: 'https://uol.edu.pk' })
  @IsOptional() @IsUrl() @MaxLength(500)
  websiteUrl?: string;

  @ApiPropertyOptional({ enum: DeploymentModel, default: DeploymentModel.SAAS })
  @IsOptional() @IsEnum(DeploymentModel)
  deploymentModel?: DeploymentModel;

  @ApiPropertyOptional({ example: 'PK', default: 'PK' })
  @IsOptional() @IsString() @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional({ example: 'PB' })
  @IsOptional() @IsString() @MaxLength(20)
  provinceCode?: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional() @IsString() @MaxLength(100)
  city?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) legalName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500) websiteUrl?: string;
  @ApiPropertyOptional({ enum: TenantStatus }) @IsOptional() @IsEnum(TenantStatus) status?: TenantStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) provinceCode?: string;
}

export class CreateTenantContactDto {
  @ApiProperty({ enum: ContactType, example: ContactType.PRIMARY })
  @IsEnum(ContactType)
  contactType!: ContactType;

  @ApiProperty({ example: 'Ali' }) @IsString() @MaxLength(100) firstName!: string;
  @ApiPropertyOptional({ example: 'Hassan' }) @IsOptional() @IsString() @MaxLength(100) middleName?: string;
  @ApiPropertyOptional({ example: 'Khan' }) @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @ApiPropertyOptional({ example: 'Registrar' }) @IsOptional() @IsString() @MaxLength(150) designation?: string;
  @ApiPropertyOptional({ example: 'Academics' }) @IsOptional() @IsString() @MaxLength(150) department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) responsibility?: string;
  @ApiPropertyOptional({ example: 'ali@uol.edu.pk' }) @IsOptional() @IsEmail() @MaxLength(255) email?: string;
  @ApiPropertyOptional({ example: '+923001234567' }) @IsOptional() @IsString() @MaxLength(30) mobilePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) landlinePhone?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateTenantContactDto {
  @ApiPropertyOptional({ enum: ContactType }) @IsOptional() @IsEnum(ContactType) contactType?: ContactType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) middleName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) designation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) responsibility?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(255) email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) mobilePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) landlinePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateTenantAddressDto {
  @ApiProperty({ enum: AddressType, example: AddressType.HEAD_OFFICE })
  @IsEnum(AddressType) addressType!: AddressType;
  @ApiProperty({ example: '1-KM Defence Road' }) @IsString() @MaxLength(255) addressLine1!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) addressLine2?: string;
  @ApiPropertyOptional({ example: 'Raiwind Road' }) @IsOptional() @IsString() @MaxLength(150) area?: string;
  @ApiProperty({ example: 'Lahore' }) @IsString() @MaxLength(100) city!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) district?: string;
  @ApiPropertyOptional({ example: 'PB' }) @IsOptional() @IsString() @MaxLength(20) provinceCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) postalCode?: string;
  @ApiPropertyOptional({ example: 'PK', default: 'PK' }) @IsOptional() @IsString() @MaxLength(2) countryCode?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateTenantAddressDto {
  @ApiPropertyOptional({ enum: AddressType }) @IsOptional() @IsEnum(AddressType) addressType?: AddressType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) addressLine1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) addressLine2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) area?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) district?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) provinceCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2) countryCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateTenantIdentifierDto {
  @ApiProperty({ enum: IdentifierType, example: IdentifierType.REGISTRATION })
  @IsEnum(IdentifierType) identifierType!: IdentifierType;
  @ApiProperty({ example: 'REG-12345-2020' }) @IsString() @MaxLength(150) identifierValue!: string;
  @ApiPropertyOptional({ example: 'SECP' }) @IsOptional() @IsString() @MaxLength(150) issuingAuthority?: string;
  @ApiPropertyOptional({ example: '2020-01-15' }) @IsOptional() @IsDateString() issueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
}

export class UpdateTenantIdentifierDto {
  @ApiPropertyOptional({ enum: IdentifierType }) @IsOptional() @IsEnum(IdentifierType) identifierType?: IdentifierType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) identifierValue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) issuingAuthority?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() issueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isVerified?: boolean;
}

export class CreateTenantConfigurationDto {
  @ApiPropertyOptional({ default: 'Asia/Karachi' }) @IsOptional() @IsString() @MaxLength(100) timezone?: string;
  @ApiPropertyOptional({ default: 'en-PK' }) @IsOptional() @IsString() @MaxLength(20) locale?: string;
  @ApiPropertyOptional({ example: 'DD/MM/YYYY' }) @IsOptional() @IsString() @MaxLength(30) dateFormat?: string;
  @ApiPropertyOptional({ default: 'PKR' }) @IsOptional() @IsString() @MaxLength(3) currencyCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) brandingName?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500) logoUrl?: string;
}

export class UpdateTenantConfigurationDto extends CreateTenantConfigurationDto {}

export class CreateTenantSmtpDto {
  @ApiProperty({ example: 'smtp.gmail.com' }) @IsString() @MaxLength(255) host!: string;
  @ApiPropertyOptional({ default: 587 }) @IsOptional() @IsInt() @Min(1) @Max(65535) port?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) username?: string;
  @ApiPropertyOptional({ description: 'Reference to secret manager, never plaintext' })
  @IsOptional() @IsString() @MaxLength(500) passwordSecretRef?: string;
  @ApiPropertyOptional({ enum: SmtpEncryption, default: SmtpEncryption.TLS })
  @IsOptional() @IsEnum(SmtpEncryption) encryption?: SmtpEncryption;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) fromName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(255) fromEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(255) replyToEmail?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateTenantSmtpDto extends CreateTenantSmtpDto {}

export class CreateTenantAssetDto {
  @ApiProperty({ enum: AssetType, example: AssetType.LOGO })
  @IsEnum(AssetType) assetType!: AssetType;
  @ApiProperty({ example: 'https://cdn.taleem.ai/tenants/uol/logo.png' })
  @IsUrl() @MaxLength(1000) fileUrl!: string;
  @ApiPropertyOptional({ example: 'logo.png' }) @IsOptional() @IsString() @MaxLength(255) fileName?: string;
  @ApiPropertyOptional({ example: 'image/png' }) @IsOptional() @IsString() @MaxLength(100) contentType?: string;
}

export class UpdateTenantAssetDto {
  @ApiPropertyOptional({ enum: AssetType }) @IsOptional() @IsEnum(AssetType) assetType?: AssetType;
  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(1000) fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) fileName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) contentType?: string;
}

export class CreateInstitutionProfileDto {
  @ApiProperty({ example: 'University of Lahore (Private) Limited' })
  @IsString() @MaxLength(255) legalName!: string;
  @ApiProperty({ example: 'University of Lahore' })
  @IsString() @MaxLength(255) displayName!: string;
  @ApiPropertyOptional({ example: 'REG-12345' }) @IsOptional() @IsString() @MaxLength(100) registrationNumber?: string;
  @ApiPropertyOptional({ enum: CampusType }) @IsOptional() @IsEnum(CampusType) campusType?: CampusType;
  @ApiPropertyOptional({ example: 'UNIVERSITY' }) @IsOptional() @IsString() @MaxLength(50) institutionType?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500) website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) addressLine1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) addressLine2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) stateProvince?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) postalCode?: string;
  @ApiPropertyOptional({ example: 'PK' }) @IsOptional() @IsString() @MaxLength(10) countryCode?: string;
}

export class UpdateInstitutionProfileDto extends CreateInstitutionProfileDto {}

export class CreateTenantBrandingDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() logoAssetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() logoDarkAssetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() faviconAssetId?: string;
  @ApiPropertyOptional({ example: '#1A73E8' }) @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/) primaryColor?: string;
  @ApiPropertyOptional({ example: '#FFFFFF' }) @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/) secondaryColor?: string;
  @ApiPropertyOptional({ example: '#FF5722' }) @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/) accentColor?: string;
  @ApiPropertyOptional({ example: 'Inter, sans-serif' }) @IsOptional() @IsString() fontFamily?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emailFromName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() emailFromAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() supportEmail?: string;
}

export class UpdateTenantBrandingDto extends CreateTenantBrandingDto {}

export class OnboardTenantDto {
  @ApiProperty({ type: CreateTenantDto })
  @ValidateNested() @Type(() => CreateTenantDto)
  tenant!: CreateTenantDto;

  @ApiProperty({ type: CreateInstitutionProfileDto })
  @ValidateNested() @Type(() => CreateInstitutionProfileDto)
  institutionProfile!: CreateInstitutionProfileDto;

  @ApiPropertyOptional({ type: CreateTenantConfigurationDto })
  @IsOptional() @ValidateNested() @Type(() => CreateTenantConfigurationDto)
  configuration?: CreateTenantConfigurationDto;

  @ApiPropertyOptional({ type: [CreateTenantContactDto] })
  @IsOptional() @ValidateNested({ each: true }) @Type(() => CreateTenantContactDto)
  contacts?: CreateTenantContactDto[];
}

export class TenantIdParamDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() tenantId!: string;
}

export class ResourceIdParamDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
}
