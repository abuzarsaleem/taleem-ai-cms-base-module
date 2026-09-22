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
  @ApiPropertyOptional({ description: 'Resolved public or signed logo URL' })
  logoUrl?: string;
  @ApiProperty({
    description: 'Distinct tenants with commercially usable ACTIVE entitlement to this application',
    example: 3,
  })
  tenantCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class RegisteredApplicationRoleDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() roleCode!: string;
  @ApiProperty() roleName!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiProperty() roleType!: string;
  @ApiProperty({ type: [String] }) permissionCodes!: string[];
}

export class RegisterApplicationResponseDto {
  @ApiProperty({ type: ApplicationResponseDto })
  application!: ApplicationResponseDto;

  @ApiProperty({ type: [RegisteredApplicationRoleDto] })
  roles!: RegisteredApplicationRoleDto[];
}

export class ApplicationCatalogueVsPreviousMonthDto {
  @ApiProperty({ description: 'Net change in total applications since start of month' })
  total!: number;
  @ApiProperty({ description: 'Net change in ACTIVE applications since start of month' })
  active!: number;
  @ApiProperty({ description: 'Net change in INACTIVE applications since start of month' })
  inactive!: number;
}

export class ApplicationCatalogueLatestVersionDto {
  @ApiProperty() name!: string;
  @ApiProperty() applicationCode!: string;
  @ApiProperty() version!: string;
}

export class ApplicationCatalogueStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() inactive!: number;
  @ApiProperty({ type: ApplicationCatalogueVsPreviousMonthDto })
  vsPreviousMonth!: ApplicationCatalogueVsPreviousMonthDto;
  @ApiPropertyOptional({ type: ApplicationCatalogueLatestVersionDto })
  latestVersion?: ApplicationCatalogueLatestVersionDto;
}

export class ApplicationListResponseDto {
  @ApiProperty({ type: [ApplicationResponseDto] }) data!: ApplicationResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
  @ApiProperty({ type: ApplicationCatalogueStatsDto })
  stats!: ApplicationCatalogueStatsDto;
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
  @ApiPropertyOptional({
    description: 'Tenant-specific launch URL (falls back to catalog URL when omitted)',
  })
  launchUrl?: string;
  @ApiPropertyOptional({ description: 'Licensed user seats; omitted/null means unlimited' })
  maxUsers?: number | null;
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
  @ApiPropertyOptional({ description: 'Resolved launch URL (tenant override or catalog default)' })
  launchUrl?: string;
  @ApiPropertyOptional({ description: 'Licensed user seats; omitted/null means unlimited' })
  maxUsers?: number | null;
  @ApiPropertyOptional({ description: 'Resolved public or signed logo URL' })
  logoUrl?: string;
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
