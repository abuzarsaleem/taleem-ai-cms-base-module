import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationMetaDto, PaginationQueryDto } from '@app/common';
import { ApplicationAccessStatus } from '../../infrastructure/persistence/access.entities.js';

const UUID_LIKE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class CreateApplicationAccessDto {
  @ApiProperty({ format: 'uuid' })
  @Matches(UUID_LIKE, { message: 'userId must be a UUID' })
  userId!: string;

  @ApiProperty({ format: 'uuid', description: 'Entitled application id' })
  @Matches(UUID_LIKE, { message: 'applicationId must be a UUID' })
  applicationId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Application role id (e.g. ALUMNI_MEMBER or ALUMNI_ADMIN)',
  })
  @Matches(UUID_LIKE, { message: 'roleId must be a UUID' })
  roleId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateApplicationAccessDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'roleId must be a UUID' })
  roleId?: string;

  @ApiPropertyOptional({ enum: ApplicationAccessStatus })
  @IsOptional()
  @IsEnum(ApplicationAccessStatus)
  status?: ApplicationAccessStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ApplicationAccessQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'userId must be a UUID' })
  userId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'applicationId must be a UUID' })
  applicationId?: string;

  @ApiPropertyOptional({ enum: ApplicationAccessStatus })
  @IsOptional()
  @IsEnum(ApplicationAccessStatus)
  status?: ApplicationAccessStatus;
}

/** Query for listing apps assigned to a specific membership (userId comes from the path). */
export class MembershipApplicationAccessQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'applicationId must be a UUID' })
  applicationId?: string;

  @ApiPropertyOptional({ enum: ApplicationAccessStatus })
  @IsOptional()
  @IsEnum(ApplicationAccessStatus)
  status?: ApplicationAccessStatus;
}

export class ApplicationAccessResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiPropertyOptional() applicationCode?: string;
  @ApiPropertyOptional() applicationName?: string;
  @ApiPropertyOptional({ description: 'Catalog launch URL for the application' })
  launchUrl?: string;
  @ApiProperty({ format: 'uuid' }) roleId!: string;
  @ApiPropertyOptional() roleCode?: string;
  @ApiPropertyOptional() roleName?: string;
  @ApiProperty({ enum: ApplicationAccessStatus }) status!: ApplicationAccessStatus;
  @ApiProperty() isDefault!: boolean;
  @ApiPropertyOptional({ type: [String] }) permissionCodes?: string[];
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class ApplicationAccessListResponseDto {
  @ApiProperty({ type: [ApplicationAccessResponseDto] }) data!: ApplicationAccessResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class ApplicationPermissionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiProperty() permissionCode!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
}

export class ApplicationRoleResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() roleCode!: string;
  @ApiProperty() roleName!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiProperty() roleType!: string;
  @ApiProperty({ type: [String] }) permissionCodes!: string[];
}

export class CreateApplicationRoleDto {
  @ApiProperty({ example: 'ALUMNI_MEMBER', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  roleCode!: string;

  @ApiProperty({ example: 'Alumni Member', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  roleName!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Application permission IDs to grant on create',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Matches(UUID_LIKE, { each: true, message: 'each permissionId must be a UUID' })
  permissionIds?: string[];
}

export class UpdateApplicationRoleDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleName?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class AddApplicationRolePermissionsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Application permission IDs belonging to the same application',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Matches(UUID_LIKE, { each: true, message: 'each permissionId must be a UUID' })
  permissionIds!: string[];
}

export class ListApplicationRolesQueryDto {
  @ApiPropertyOptional({ example: 'ALUMNI' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  applicationCode?: string;
}

export class MyApplicationsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant to resolve (defaults to first ACTIVE membership)',
  })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
  tenantId?: string;
}

/** Member-facing application card (entitled + assigned). */
export class MyApplicationResponseDto {
  @ApiProperty({ format: 'uuid' }) assignmentId!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiProperty() applicationCode!: string;
  @ApiProperty() applicationName!: string;
  @ApiPropertyOptional() launchUrl?: string;
  @ApiPropertyOptional() logoUrl?: string;
  @ApiProperty({ format: 'uuid' }) roleId!: string;
  @ApiProperty() roleCode!: string;
  @ApiPropertyOptional() roleName?: string;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty({ enum: ApplicationAccessStatus }) status!: ApplicationAccessStatus;
}
