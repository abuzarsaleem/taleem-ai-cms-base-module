import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApplicationAccessResponseDto } from '../../../../access/application/dto/access.dto.js';
import { CreateTenantInvitationResponseDto } from '../response/invitation.response.dto.js';

export class ApplicantMemberOnboardDto {
  @ApiProperty({ example: 'muhammad.ahmed@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({
    example: 'Muhammad Ahmed',
    description: 'Optional display name for invitation metadata',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Mark ADMISSIONS_APPLICANT as the member default app after accept',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export enum ApplicantMemberOnboardStatus {
  INVITED = 'INVITED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
}

export class ApplicantMemberOnboardResponseDto {
  @ApiProperty({ enum: ApplicantMemberOnboardStatus })
  status!: ApplicantMemberOnboardStatus;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({
    description: 'Present when status is INVITED — invitation token for verification email',
  })
  invitation?: CreateTenantInvitationResponseDto;

  @ApiPropertyOptional({
    description: 'Present when status is ACCESS_GRANTED — member already existed',
  })
  applicationAccess?: ApplicationAccessResponseDto;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Identity id when ACCESS_GRANTED',
  })
  userId?: string;
}
