import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@app/common';
import { InvitationStatus } from '../../../domain/invitation.types.js';
import { MembershipRole } from '../../../domain/membership.types.js';

export class TenantInvitationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: MembershipRole }) role!: MembershipRole;
  @ApiProperty({ enum: InvitationStatus }) status!: InvitationStatus;
  @ApiProperty() expiresAt!: Date;
  @ApiPropertyOptional() acceptedAt?: Date;
  @ApiProperty({ format: 'uuid' }) invitedBy!: string;
  @ApiProperty() createdAt!: Date;
}

export class TenantInvitationListResponseDto {
  @ApiProperty({ type: [TenantInvitationResponseDto] })
  data!: TenantInvitationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class CreateTenantInvitationResponseDto extends TenantInvitationResponseDto {
  @ApiProperty({
    description: 'Raw invitation token — only returned once at creation/resend; emailed as one accept link',
  })
  invitationToken!: string;
}

/** @deprecated aliases for excluded legacy controllers */
export class TenantAdminInvitationResponseDto extends TenantInvitationResponseDto {}
export class TenantAdminInvitationListResponseDto extends TenantInvitationListResponseDto {}
export class CreateTenantAdminInvitationResponseDto extends CreateTenantInvitationResponseDto {}
