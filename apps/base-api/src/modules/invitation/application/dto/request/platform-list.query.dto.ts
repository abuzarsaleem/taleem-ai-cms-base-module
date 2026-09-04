import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@app/common';
import { InvitationStatus } from '../../../domain/invitation.types.js';
import { MembershipRole, MembershipStatus } from '../../../domain/membership.types.js';

export class PlatformInvitationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
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
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
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
