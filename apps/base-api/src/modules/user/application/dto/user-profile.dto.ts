import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UserProfileResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() emailVerified!: boolean;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ description: 'Resolved public URL for the profile picture' })
  avatarUrl?: string;
  @ApiProperty({ type: [String] }) roles!: string[];
  @ApiProperty({ type: [String] }) permissions!: string[];
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Ali Khan' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: 'ali@university.edu' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}

export class UploadUserAvatarDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty() changed!: boolean;
  @ApiProperty() message!: string;
}
