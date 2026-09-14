import { ApiProperty } from '@nestjs/swagger';
import { TenantInvitationResponseDto } from '../../../invitation/application/dto/response/invitation.response.dto.js';
import { TenantMembershipResponseDto } from '../../../invitation/application/dto/response/membership.response.dto.js';

export class TenantDashboardPendingInvitationsDto {
  @ApiProperty() admin!: number;
  @ApiProperty() member!: number;
  @ApiProperty() total!: number;
}

export class TenantDashboardProfileCountsDto {
  @ApiProperty() contacts!: number;
  @ApiProperty() addresses!: number;
  @ApiProperty() identifiers!: number;
  @ApiProperty() assets!: number;
}

export class TenantDashboardSubscriptionSummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() inactive!: number;
}

export class TenantDashboardEntitlementSummaryDto {
  @ApiProperty({ description: 'Rows on tenant_entitlements' })
  total!: number;
  @ApiProperty() active!: number;
}

export class TenantDashboardResponseDto {
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() membersCount!: number;
  @ApiProperty({ type: TenantDashboardPendingInvitationsDto })
  pendingInvitations!: TenantDashboardPendingInvitationsDto;
  @ApiProperty({
    description: 'Policy-valid entitled applications (commercially usable)',
  })
  entitledApplicationsCount!: number;
  @ApiProperty({ type: TenantDashboardProfileCountsDto })
  profile!: TenantDashboardProfileCountsDto;
  @ApiProperty({ type: TenantDashboardSubscriptionSummaryDto })
  subscriptions!: TenantDashboardSubscriptionSummaryDto;
  @ApiProperty({ type: TenantDashboardEntitlementSummaryDto })
  entitlements!: TenantDashboardEntitlementSummaryDto;
  @ApiProperty({ type: [TenantMembershipResponseDto] })
  recentMembers!: TenantMembershipResponseDto[];
  @ApiProperty({ type: [TenantInvitationResponseDto] })
  recentInvitations!: TenantInvitationResponseDto[];
}
