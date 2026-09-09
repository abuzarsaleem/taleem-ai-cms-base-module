import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
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

/** Direct create (no invitation link). Password + full name required. */
export class CreateTenantMembershipDto {
  @ApiProperty({ example: 'user@university.edu' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Ali Khan' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName!: string;
}
