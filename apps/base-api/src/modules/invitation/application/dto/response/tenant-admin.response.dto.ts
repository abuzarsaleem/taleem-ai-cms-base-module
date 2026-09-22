import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@app/common';
import { MembershipRole, MembershipStatus } from '../../../domain/membership.types.js';
import { CreateTenantInvitationResponseDto } from './invitation.response.dto.js';
import { TenantMembershipResponseDto } from './membership.response.dto.js';
import { ApplicationAccessResponseDto } from '../../../../access/application/dto/access.dto.js';

export class TenantAdminApplicationSummaryDto {
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiProperty() applicationCode!: string;
  @ApiProperty() applicationName!: string;
  @ApiPropertyOptional() roleCode?: string;
  @ApiPropertyOptional() roleName?: string;
  @ApiProperty() status!: string;
}

export class PlatformTenantAdminResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() tenantCode!: string;
  @ApiProperty() tenantDisplayName!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() userEmail!: string;
  @ApiProperty() userFullName!: string;
  @ApiProperty({ enum: MembershipStatus }) status!: string;
  @ApiProperty({ enum: MembershipRole }) role!: string;
  @ApiProperty() isTenantAdmin!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() joinedAt!: Date;
  @ApiProperty({ type: [TenantAdminApplicationSummaryDto] })
  applications!: TenantAdminApplicationSummaryDto[];
}

export class PlatformTenantAdminListResponseDto {
  @ApiProperty({ type: [PlatformTenantAdminResponseDto] })
  data!: PlatformTenantAdminResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class ProvisionTenantAdminResponseDto {
  @ApiProperty({ enum: ['INVITED', 'CREATED'] })
  status!: 'INVITED' | 'CREATED';

  @ApiPropertyOptional({ type: CreateTenantInvitationResponseDto })
  invitation?: CreateTenantInvitationResponseDto;

  @ApiPropertyOptional({ type: TenantMembershipResponseDto })
  membership?: TenantMembershipResponseDto;

  @ApiPropertyOptional({ type: [ApplicationAccessResponseDto] })
  applicationAccess?: ApplicationAccessResponseDto[];
}
