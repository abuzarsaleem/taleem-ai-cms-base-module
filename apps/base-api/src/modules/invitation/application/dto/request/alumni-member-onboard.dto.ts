import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApplicationAccessResponseDto } from '../../../../access/application/dto/access.dto.js';
import { CreateTenantInvitationResponseDto } from '../response/invitation.response.dto.js';

export class AlumniMemberOnboardDto {
  @ApiProperty({ example: 'alumni@university.edu' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({
    example: 'Ali Khan',
    description: 'Optional display name hint for Alumni; not required for base invite',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Mark ALUMNI_MEMBER assignment as the member default app after accept',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export enum AlumniMemberOnboardStatus {
  INVITED = 'INVITED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
}

export class AlumniMemberOnboardResponseDto {
  @ApiProperty({ enum: AlumniMemberOnboardStatus })
  status!: AlumniMemberOnboardStatus;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({
    description: 'Present when status is INVITED — base platform invitation + email sent',
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
