import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@app/common';
import {
  BillingCycle,
  EntitlementStatus,
  PlanType,
  SubscriptionStatus,
} from '../../../domain/subscription.types.js';

const UUID_LIKE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class PlatformSubscriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
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
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'applicationId must be a UUID' })
  applicationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'subscriptionId must be a UUID' })
  subscriptionId?: string;

  @ApiPropertyOptional({ enum: EntitlementStatus })
  @IsOptional()
  @IsEnum(EntitlementStatus)
  status?: EntitlementStatus;
}

export type PlatformSubscriptionFilters = Omit<PlatformSubscriptionQueryDto, 'page' | 'limit'>;
export type PlatformEntitlementFilters = Omit<PlatformEntitlementQueryDto, 'page' | 'limit'>;
