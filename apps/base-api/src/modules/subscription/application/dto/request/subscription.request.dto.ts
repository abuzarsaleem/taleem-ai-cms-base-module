import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
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
}

export class UpdateApplicationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) version?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500) launchUrl?: string;
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

  @ApiProperty({ type: [String], example: ['ALUMNI', 'ADMISSIONS'] })
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) @MaxLength(50, { each: true })
  applicationCodes!: string[];
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

  @ApiPropertyOptional({ type: [String], example: ['ALUMNI'] })
  @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true }) @MaxLength(50, { each: true })
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
}

export class UpdateTenantEntitlementDto {
  @ApiPropertyOptional({ enum: EntitlementStatus })
  @IsOptional() @IsEnum(EntitlementStatus)
  status?: EntitlementStatus;

  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subscriptionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveUntil?: string;
}
