import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { MembershipStatus } from '../../../domain/membership.types.js';

export class UpdateTenantMembershipDto {
  @ApiPropertyOptional({ enum: MembershipStatus, example: MembershipStatus.SUSPENDED })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ description: 'Promote or demote tenant administrator role' })
  @IsOptional()
  @IsBoolean()
  isTenantAdmin?: boolean;
}
