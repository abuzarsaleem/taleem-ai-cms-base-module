import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@app/common';
import {
  ApplicationStatus,
  BillingCycle,
  EntitlementStatus,
  PlanType,
  SubscriptionStatus,
} from '../../../domain/subscription.types.js';

export class ApplicationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'ALUMNI' }) applicationCode!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() version?: string;
  @ApiProperty({ enum: ApplicationStatus }) status!: ApplicationStatus;
  @ApiPropertyOptional() launchUrl?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class ApplicationListResponseDto {
  @ApiProperty({ type: [ApplicationResponseDto] }) data!: ApplicationResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class PlanLimitsResponseDto {
  @ApiProperty({ type: [String], example: ['ALUMNI'] }) applicationCodes!: string[];
}

export class SubscriptionPlanResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() planCode!: string;
  @ApiProperty() planName!: string;
  @ApiProperty({ enum: PlanType }) planType!: PlanType;
  @ApiPropertyOptional({ enum: BillingCycle }) billingCycle?: BillingCycle;
  @ApiProperty() price!: number;
  @ApiPropertyOptional() trialDays?: number;
  @ApiProperty({ type: PlanLimitsResponseDto }) limits!: PlanLimitsResponseDto;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class SubscriptionPlanListResponseDto {
  @ApiProperty({ type: [SubscriptionPlanResponseDto] }) data!: SubscriptionPlanResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class SubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiPropertyOptional({ format: 'uuid' }) planId?: string;
  @ApiProperty() subscriptionCode!: string;
  @ApiProperty({ enum: SubscriptionStatus }) status!: SubscriptionStatus;
  @ApiProperty({ example: '2026-09-01' }) startDate!: string;
  @ApiPropertyOptional({ example: '2027-08-31' }) endDate?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class SubscriptionListResponseDto {
  @ApiProperty({ type: [SubscriptionResponseDto] }) data!: SubscriptionResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class EntitlementResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiPropertyOptional() applicationCode?: string;
  @ApiPropertyOptional() applicationName?: string;
  @ApiPropertyOptional({ format: 'uuid' }) subscriptionId?: string;
  @ApiProperty({ enum: EntitlementStatus }) status!: EntitlementStatus;
  @ApiProperty() effectiveFrom!: Date;
  @ApiPropertyOptional() effectiveUntil?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class EntitlementListResponseDto {
  @ApiProperty({ type: [EntitlementResponseDto] }) data!: EntitlementResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class ReconciliationSummaryDto {
  @ApiProperty({ description: 'Active tenant memberships; they are not deleted on entitlement change' })
  activeMemberships!: number;

  @ApiProperty({ type: [String], example: ['ALUMNI'] })
  applicationsNowUnavailable!: string[];

  @ApiProperty({ example: true })
  membershipsUnchanged!: true;
}

export class EntitlementChangeResponseDto extends EntitlementResponseDto {
  @ApiProperty({ type: ReconciliationSummaryDto })
  reconciliation!: ReconciliationSummaryDto;
}

export class SubscriptionChangeResponseDto {
  @ApiProperty({ type: SubscriptionResponseDto }) subscription!: SubscriptionResponseDto;
  @ApiProperty({ type: [EntitlementResponseDto] }) affectedEntitlements!: EntitlementResponseDto[];
  @ApiProperty({ type: ReconciliationSummaryDto }) reconciliation!: ReconciliationSummaryDto;
}

export class AvailableApplicationResponseDto {
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiProperty() applicationCode!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() launchUrl?: string;
  @ApiProperty({ format: 'uuid' }) entitlementId!: string;
  @ApiProperty() effectiveFrom!: Date;
  @ApiPropertyOptional() effectiveUntil?: Date;
  @ApiPropertyOptional({ format: 'uuid' }) subscriptionId?: string;
}

export class TenantAvailabilityResponseDto {
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ type: [AvailableApplicationResponseDto] }) applications!: AvailableApplicationResponseDto[];
}

export class ApplicationAccessResponseDto {
  @ApiProperty() applicationCode!: string;
  @ApiProperty() entitled!: boolean;
  @ApiPropertyOptional() reason?: string;
  @ApiPropertyOptional({ type: EntitlementResponseDto }) entitlement?: EntitlementResponseDto;
}
