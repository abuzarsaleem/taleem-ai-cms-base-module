import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@app/common';
import { InvitationStatus } from '../../../domain/invitation.types.js';
import { MembershipRole, MembershipStatus } from '../../../domain/membership.types.js';

const UUID_LIKE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class PlatformInvitationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
  tenantId?: string;

  @ApiPropertyOptional({ example: 'user@university.edu' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ enum: InvitationStatus })
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;
}

export class PlatformMembershipQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'tenantId must be a UUID' })
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @Matches(UUID_LIKE, { message: 'userId must be a UUID' })
  userId?: string;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ enum: MembershipRole })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @ApiPropertyOptional({ description: 'Filter by user email (partial match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;
}

export type PlatformInvitationFilters = Omit<PlatformInvitationQueryDto, 'page' | 'limit'>;
export type PlatformMembershipFilters = Omit<PlatformMembershipQueryDto, 'page' | 'limit'>;
