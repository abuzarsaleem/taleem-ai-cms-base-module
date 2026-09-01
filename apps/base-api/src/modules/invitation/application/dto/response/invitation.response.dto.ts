import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@app/common';
import { InvitationStatus } from '../../../domain/invitation.types.js';

export class TenantAdminInvitationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: InvitationStatus }) status!: InvitationStatus;
  @ApiProperty() expiresAt!: Date;
  @ApiPropertyOptional() acceptedAt?: Date;
  @ApiProperty({ format: 'uuid' }) invitedBy!: string;
  @ApiProperty() createdAt!: Date;
}

export class TenantAdminInvitationListResponseDto {
  @ApiProperty({ type: [TenantAdminInvitationResponseDto] })
  data!: TenantAdminInvitationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class CreateTenantAdminInvitationResponseDto extends TenantAdminInvitationResponseDto {
  @ApiProperty({
    description: 'Raw invitation token — only returned once at creation/resend; share via email',
  })
  invitationToken!: string;
}
