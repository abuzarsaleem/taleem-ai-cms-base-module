import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '../../../tenant/domain/tenant.types.js';
import { ApplicationResponseDto } from '../../../subscription/application/dto/response/subscription.response.dto.js';

export class PlatformDashboardCountMetricDto {
  @ApiProperty({ example: 10 })
  value!: number;

  @ApiProperty({
    example: 2,
    description: 'Net change versus start of the current UTC month',
  })
  vsPreviousMonth!: number;
}

export class PlatformDashboardCountsResponseDto {
  @ApiProperty({ type: PlatformDashboardCountMetricDto })
  tenants!: PlatformDashboardCountMetricDto;

  @ApiProperty({ type: PlatformDashboardCountMetricDto })
  activeTenants!: PlatformDashboardCountMetricDto;

  @ApiProperty({ type: PlatformDashboardCountMetricDto })
  onboarding!: PlatformDashboardCountMetricDto;

  @ApiProperty({ type: PlatformDashboardCountMetricDto })
  applications!: PlatformDashboardCountMetricDto;
}

export class PlatformDashboardAttentionItemDto {
  @ApiProperty({ example: 'tenantsAwaitingActivation' })
  key!: string;

  @ApiProperty({ example: 'Tenants awaiting activation' })
  label!: string;

  @ApiProperty({ example: 2 })
  count!: number;
}

export class PlatformDashboardAttentionResponseDto {
  @ApiProperty({ type: [PlatformDashboardAttentionItemDto] })
  items!: PlatformDashboardAttentionItemDto[];

  @ApiProperty({ example: 10, description: 'Sum of item counts' })
  total!: number;
}

export class PlatformDashboardApplicationsResponseDto {
  @ApiProperty({ type: [ApplicationResponseDto] })
  data!: ApplicationResponseDto[];
}

export class PlatformDashboardRecentTenantDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Punjab University' }) displayName!: string;
  @ApiProperty({ example: 'punjab-university' }) tenantCode!: string;
  @ApiProperty({ enum: TenantStatus }) status!: TenantStatus | string;
  @ApiProperty({ description: 'Joined / created timestamp' }) joinedAt!: Date;
}

export class PlatformDashboardRecentTenantsResponseDto {
  @ApiProperty({ type: [PlatformDashboardRecentTenantDto] })
  data!: PlatformDashboardRecentTenantDto[];
}

export class PlatformDashboardActivityItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() action!: string;
  @ApiProperty({ example: 'Tenant approved and activated' })
  summary!: string;
  @ApiPropertyOptional({ format: 'uuid' }) tenantId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) actorUserId?: string;
  @ApiPropertyOptional() entityType?: string;
  @ApiPropertyOptional({ format: 'uuid' }) entityId?: string;
  @ApiProperty() createdAt!: Date;
}

export class PlatformDashboardActivityResponseDto {
  @ApiProperty({ type: [PlatformDashboardActivityItemDto] })
  data!: PlatformDashboardActivityItemDto[];
}

export enum PlatformComponentStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN',
}

export class PlatformDashboardSystemComponentDto {
  @ApiProperty({ example: 'platformApi' }) key!: string;
  @ApiProperty({ example: 'Platform API' }) label!: string;
  @ApiProperty({ enum: PlatformComponentStatus })
  status!: PlatformComponentStatus;
  @ApiPropertyOptional() detail?: string;
}

export class PlatformDashboardSystemStatusResponseDto {
  @ApiProperty({ enum: PlatformComponentStatus })
  overall!: PlatformComponentStatus;

  @ApiProperty({ type: [PlatformDashboardSystemComponentDto] })
  components!: PlatformDashboardSystemComponentDto[];

  @ApiProperty() checkedAt!: string;
}
