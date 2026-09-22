import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  BillingCycle,
  EntitlementStatus,
  PlanType,
  SubscriptionStatus,
} from '../../../domain/subscription.types.js';

export class CreateApplicationDto {
  @ApiProperty({ example: 'ALUMNI', maxLength: 50 })
  @IsString() @MinLength(2) @MaxLength(50)
  applicationCode!: string;

  @ApiProperty({ example: 'Alumni Network' })
  @IsString() @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional() @IsString() @MaxLength(50)
  version?: string;

  @ApiPropertyOptional({ example: 'https://alumni.taleem.ai' })
  @IsOptional() @IsUrl() @MaxLength(500)
  launchUrl?: string;

  @ApiPropertyOptional({
    description: 'External logo URL. Prefer POST /application/:id/logo for file upload.',
    example: 'https://cdn.example.com/alumni-logo.png',
  })
  @IsOptional() @IsUrl() @MaxLength(1000)
  logoUrl?: string;
}

export class RegisterApplicationRoleDto {
  @ApiProperty({ example: 'ALUMNI_ADMIN', maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  roleCode!: string;

  @ApiProperty({ example: 'Alumni Admin', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  roleName!: string;

  @ApiPropertyOptional({ example: 'Full administrative access', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class RegisterApplicationDto extends CreateApplicationDto {
  @ApiPropertyOptional({
    type: [RegisterApplicationRoleDto],
    description: 'Optional system roles to create with the application (permissions can be added later)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: RegisterApplicationRoleDto) =>
    typeof item?.roleCode === 'string' ? item.roleCode.trim().toUpperCase() : item?.roleCode,
  )
  @ValidateNested({ each: true })
  @Type(() => RegisterApplicationRoleDto)
  roles?: RegisterApplicationRoleDto[];
}

export class UpdateApplicationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) version?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500) launchUrl?: string;
  @ApiPropertyOptional({
    description: 'External logo URL. Prefer POST /application/:id/logo for file upload.',
  })
  @IsOptional() @IsUrl() @MaxLength(1000)
  logoUrl?: string;
}

export class SubscriptionApplicationItemDto {
  @ApiProperty({ example: 'ALUMNI' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  applicationCode!: string;

  @ApiPropertyOptional({
    example: 'https://alumni.pu.edu.pk',
    description: 'Tenant-specific launch URL for this application',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  launchUrl?: string;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Licensed user seats for this application; omit for unlimited',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;
}

export class CreateTenantSubscriptionDto {
  @ApiProperty({ example: '2026-09-01', description: 'Inclusive start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2027-08-31', description: 'Inclusive end date (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ enum: PlanType })
  @IsEnum(PlanType)
  planType!: PlanType;

  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional() @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({
    type: [SubscriptionApplicationItemDto],
    description: 'Preferred: apps with optional tenant launchUrl and maxUsers',
  })
  @ValidateIf((o: CreateTenantSubscriptionDto) => !o.applicationCodes?.length)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((item: SubscriptionApplicationItemDto) => item.applicationCode)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionApplicationItemDto)
  applications?: SubscriptionApplicationItemDto[];

  @ApiPropertyOptional({
    type: [String],
    example: ['ALUMNI', 'ADMISSIONS'],
    description: 'Legacy: application codes only (no launchUrl/maxUsers). Prefer applications.',
  })
  @ValidateIf((o: CreateTenantSubscriptionDto) => !o.applications?.length)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  applicationCodes?: string[];
}

export class UpdateTenantSubscriptionDto {
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-08-31' })
  @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: PlanType })
  @IsOptional() @IsEnum(PlanType)
  planType?: PlanType;

  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional() @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ type: [SubscriptionApplicationItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((item: SubscriptionApplicationItemDto) => item.applicationCode)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionApplicationItemDto)
  applications?: SubscriptionApplicationItemDto[];

  @ApiPropertyOptional({
    type: [String],
    example: ['ALUMNI'],
    description: 'Legacy codes-only update. Prefer applications.',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  applicationCodes?: string[];

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional() @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}

export class CreateTenantEntitlementDto {
  @ApiProperty({ example: 'ALUMNI', description: 'Registered application code' })
  @IsString() @MinLength(2) @MaxLength(50)
  applicationCode!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Link to a currently in-force tenant subscription' })
  @IsOptional() @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'When omitted, entitlement is effective immediately' })
  @IsOptional() @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ example: 'https://alumni.pu.edu.pk' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  launchUrl?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;
}

export class UpdateTenantEntitlementDto {
  @ApiPropertyOptional({ enum: EntitlementStatus })
  @IsOptional() @IsEnum(EntitlementStatus)
  status?: EntitlementStatus;

  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subscriptionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveUntil?: string;

  @ApiPropertyOptional({ example: 'https://alumni.pu.edu.pk' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  launchUrl?: string;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Set to null to clear (unlimited)',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  maxUsers?: number | null;
}
