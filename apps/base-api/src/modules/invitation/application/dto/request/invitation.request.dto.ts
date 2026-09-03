import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MembershipRole } from '../../../domain/membership.types.js';

export class CreateTenantInvitationDto {
  @ApiProperty({ example: 'user@university.edu' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    enum: MembershipRole,
    example: MembershipRole.MEMBER,
    description: 'TENANT_ADMIN or TENANT_MEMBER — same accept link either way',
  })
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}

/** @deprecated Use CreateTenantInvitationDto */
export class CreateTenantAdminInvitationDto {
  @ApiProperty({ example: 'admin@university.edu' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Raw invitation token from the email link' })
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  token!: string;

  @ApiPropertyOptional({
    example: 'SecurePass123!',
    minLength: 8,
    description: 'Required when creating a new account or the invited email has no password yet',
  })
  @ValidateIf((o: AcceptInvitationDto) => o.password !== undefined && o.password !== '')
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    example: 'Ali Khan',
    description: 'Required when creating a new account or activating one without a password',
  })
  @ValidateIf((o: AcceptInvitationDto) => o.password !== undefined && o.password !== '')
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName?: string;
}
