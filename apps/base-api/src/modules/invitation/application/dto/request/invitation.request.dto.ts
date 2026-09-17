import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
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

  @ApiProperty({
    example: 'SecurePass123!',
    minLength: 8,
    description:
      'Required. Sets the account password for new users, or must match the existing password.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    example: 'Ali Khan',
    description:
      'Optional when the invitation already carries fullName in metadata (alumni CMS bridge).',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName?: string;
}
