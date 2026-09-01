import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@app/common';
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

export class TenantResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uol-lahore' }) tenantCode!: string;
  @ApiProperty() legalName!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() institutionType!: string;
  @ApiPropertyOptional() websiteUrl?: string;
  @ApiProperty({ enum: TenantStatus }) status!: TenantStatus;
  @ApiProperty({ enum: DeploymentModel }) deploymentModel!: DeploymentModel;
  @ApiProperty({ example: 'PK' }) countryCode!: string;
  @ApiPropertyOptional() provinceCode?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() activatedAt?: Date;
  @ApiPropertyOptional() suspendedAt?: Date;
  @ApiPropertyOptional() retiredAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class TenantListResponseDto {
  @ApiProperty({ type: [TenantResponseDto] }) data!: TenantResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class TenantContactResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ enum: ContactType }) contactType!: string;
  @ApiProperty() firstName!: string;
  @ApiPropertyOptional() middleName?: string;
  @ApiPropertyOptional() lastName?: string;
  @ApiPropertyOptional() designation?: string;
  @ApiPropertyOptional() department?: string;
  @ApiPropertyOptional() responsibility?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() mobilePhone?: string;
  @ApiPropertyOptional() landlinePhone?: string;
  @ApiProperty() isPrimary!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class TenantContactListResponseDto {
  @ApiProperty({ type: [TenantContactResponseDto] }) data!: TenantContactResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class TenantAddressResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ enum: AddressType }) addressType!: string;
  @ApiProperty() addressLine1!: string;
  @ApiPropertyOptional() addressLine2?: string;
  @ApiPropertyOptional() area?: string;
  @ApiProperty() city!: string;
  @ApiPropertyOptional() district?: string;
  @ApiPropertyOptional() provinceCode?: string;
  @ApiPropertyOptional() postalCode?: string;
  @ApiProperty() countryCode!: string;
  @ApiProperty() isPrimary!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class TenantAddressListResponseDto {
  @ApiProperty({ type: [TenantAddressResponseDto] }) data!: TenantAddressResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class TenantIdentifierResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ enum: IdentifierType }) identifierType!: string;
  @ApiProperty() identifierValue!: string;
  @ApiPropertyOptional() issuingAuthority?: string;
  @ApiPropertyOptional() issueDate?: Date;
  @ApiPropertyOptional() expiryDate?: Date;
  @ApiProperty() isVerified!: boolean;
  @ApiPropertyOptional() verifiedAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class TenantIdentifierListResponseDto {
  @ApiProperty({ type: [TenantIdentifierResponseDto] }) data!: TenantIdentifierResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class TenantConfigurationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() timezone!: string;
  @ApiProperty() locale!: string;
  @ApiPropertyOptional() dateFormat?: string;
  @ApiProperty() currencyCode!: string;
  @ApiPropertyOptional() brandingName?: string;
  @ApiPropertyOptional() logoUrl?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class TenantSmtpResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() host!: string;
  @ApiProperty() port!: number;
  @ApiPropertyOptional() username?: string;
  @ApiPropertyOptional() passwordSecretRef?: string;
  @ApiProperty({ enum: SmtpEncryption }) encryption!: string;
  @ApiPropertyOptional() fromName?: string;
  @ApiPropertyOptional() fromEmail?: string;
  @ApiPropertyOptional() replyToEmail?: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class TenantAssetResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ enum: AssetType }) assetType!: string;
  @ApiProperty() fileUrl!: string;
  @ApiPropertyOptional() fileName?: string;
  @ApiPropertyOptional() contentType?: string;
  @ApiProperty() createdAt!: Date;
}

export class TenantAssetListResponseDto {
  @ApiProperty({ type: [TenantAssetResponseDto] }) data!: TenantAssetResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class InstitutionProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() legalName!: string;
  @ApiProperty() displayName!: string;
  @ApiPropertyOptional() registrationNumber?: string;
  @ApiPropertyOptional({ enum: CampusType }) campusType?: string;
  @ApiPropertyOptional() institutionType?: string;
  @ApiPropertyOptional() website?: string;
  @ApiPropertyOptional() addressLine1?: string;
  @ApiPropertyOptional() addressLine2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() stateProvince?: string;
  @ApiPropertyOptional() postalCode?: string;
  @ApiPropertyOptional() countryCode?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class TenantBrandingResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiPropertyOptional() logoAssetId?: string;
  @ApiPropertyOptional() logoDarkAssetId?: string;
  @ApiPropertyOptional() faviconAssetId?: string;
  @ApiPropertyOptional({ example: '#1A73E8' }) primaryColor?: string;
  @ApiPropertyOptional() secondaryColor?: string;
  @ApiPropertyOptional() accentColor?: string;
  @ApiPropertyOptional() fontFamily?: string;
  @ApiPropertyOptional() emailFromName?: string;
  @ApiPropertyOptional() emailFromAddress?: string;
  @ApiPropertyOptional() supportEmail?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class OnboardTenantResponseDto {
  @ApiProperty({ type: TenantResponseDto }) tenant!: TenantResponseDto;
  @ApiProperty({ type: InstitutionProfileResponseDto }) institutionProfile!: InstitutionProfileResponseDto;
  @ApiPropertyOptional({ type: TenantConfigurationResponseDto }) configuration?: TenantConfigurationResponseDto;
  @ApiPropertyOptional({ type: [TenantContactResponseDto] }) contacts?: TenantContactResponseDto[];
}
