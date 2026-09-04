import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@app/common';
import {
  BillingCycle,
  EntitlementStatus,
  PlanType,
  SubscriptionStatus,
} from '../../../domain/subscription.types.js';

export class PlatformSubscriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: PlanType })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ example: 'SUB-UOL-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subscriptionCode?: string;
}

export class PlatformEntitlementQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({ enum: EntitlementStatus })
  @IsOptional()
  @IsEnum(EntitlementStatus)
  status?: EntitlementStatus;
}

export type PlatformSubscriptionFilters = Omit<PlatformSubscriptionQueryDto, 'page' | 'limit'>;
export type PlatformEntitlementFilters = Omit<PlatformEntitlementQueryDto, 'page' | 'limit'>;
