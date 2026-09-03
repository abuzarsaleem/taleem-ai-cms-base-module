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

export class SubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() subscriptionCode!: string;
  @ApiProperty({ enum: SubscriptionStatus, description: 'INACTIVE when the period has ended or status was set inactive' })
  status!: SubscriptionStatus;
  @ApiProperty({ enum: PlanType }) planType!: PlanType;
  @ApiPropertyOptional({ enum: BillingCycle }) billingCycle?: BillingCycle;
  @ApiProperty({ type: [String], example: ['ALUMNI'] }) applicationCodes!: string[];
  @ApiProperty({ example: '2026-09-01' }) startDate!: string;
  @ApiProperty({ example: '2027-08-31' }) endDate!: string;
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
