import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BillingCycle, PlanType } from '../../../domain/subscription.types.js';

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

export class PlanLimitsDto {
  @ApiPropertyOptional({ type: [String], example: ['ALUMNI', 'ADMISSIONS'] })
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true })
  applicationCodes?: string[];
}

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'CAMPUS-PRO', maxLength: 50 })
  @IsString() @MinLength(2) @MaxLength(50)
  planCode!: string;

  @ApiProperty({ example: 'Campus Pro' })
  @IsString() @MaxLength(100)
  planName!: string;

  @ApiProperty({ enum: PlanType })
  @IsEnum(PlanType)
  planType!: PlanType;

  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional() @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 14, description: 'Allowed only when planType is TRIAL' })
  @IsOptional() @IsInt() @Min(1) @Max(365)
  trialDays?: number;

  @ApiPropertyOptional({ type: PlanLimitsDto })
  @IsOptional() @ValidateNested() @Type(() => PlanLimitsDto)
  limits?: PlanLimitsDto;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) planName?: string;
  @ApiPropertyOptional({ enum: PlanType }) @IsOptional() @IsEnum(PlanType) planType?: PlanType;
  @ApiPropertyOptional({ enum: BillingCycle }) @IsOptional() @IsEnum(BillingCycle) billingCycle?: BillingCycle;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(365) trialDays?: number;
  @ApiPropertyOptional({ type: PlanLimitsDto }) @IsOptional() @ValidateNested() @Type(() => PlanLimitsDto)
  limits?: PlanLimitsDto;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateTenantSubscriptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  planId!: string;

  @ApiProperty({ example: '2026-09-01', description: 'Inclusive start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-08-31' })
  @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Optional unique code; generated when omitted',
    example: 'CAMPUS-PRO-UOL-20260901',
  })
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  subscriptionCode?: string;
}

export class CreateTenantEntitlementDto {
  @ApiProperty({ example: 'ALUMNI', description: 'Registered application code' })
  @IsString() @MinLength(2) @MaxLength(50)
  applicationCode!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Link to a commercially valid tenant subscription' })
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
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() subscriptionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveUntil?: string;
}
