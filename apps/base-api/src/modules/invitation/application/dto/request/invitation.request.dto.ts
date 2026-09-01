import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

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
