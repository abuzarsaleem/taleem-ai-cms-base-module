import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '@app/common';
import { MembershipStatus } from '../../../domain/membership.types.js';

const UUID_LIKE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export enum ProvisionTenantAdminMode {
  INVITE = 'INVITE',
  CREATE = 'CREATE',
}

export class PlatformTenantAdminQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter admins assigned to this application' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'applicationId must be a UUID' })
  applicationId?: string;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({
    description: 'Search by name, email, or tenant code/name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

export class ProvisionApplicationAccessDto {
  @ApiProperty({ format: 'uuid' })
  @Matches(UUID_LIKE, { message: 'applicationId must be a UUID' })
  applicationId!: string;

  @ApiProperty({ format: 'uuid', description: 'Application role id (e.g. ALUMNI_ADMIN)' })
  @Matches(UUID_LIKE, { message: 'roleId must be a UUID' })
  roleId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ProvisionTenantAdminDto {
  @ApiProperty({ enum: ProvisionTenantAdminMode })
  @IsEnum(ProvisionTenantAdminMode)
  mode!: ProvisionTenantAdminMode;

  @ApiProperty({ example: 'admin@university.edu' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({
    example: 'Ali Khan',
    description: 'Required for CREATE; optional hint stored on INVITE',
  })
  @ValidateIf(
    (o: ProvisionTenantAdminDto) =>
      o.mode === ProvisionTenantAdminMode.CREATE ||
      (o.fullName !== undefined && o.fullName !== ''),
  )
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({
    example: 'SecurePass123!',
    description: 'Required when mode=CREATE',
  })
  @ValidateIf((o: ProvisionTenantAdminDto) => o.mode === ProvisionTenantAdminMode.CREATE)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    type: [ProvisionApplicationAccessDto],
    description: 'Admin Portal application access to assign (or queue until invite accept)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: ProvisionApplicationAccessDto) => item.applicationId)
  @ValidateNested({ each: true })
  @Type(() => ProvisionApplicationAccessDto)
  applications?: ProvisionApplicationAccessDto[];
}
