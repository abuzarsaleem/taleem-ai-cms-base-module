import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@university.edu' })
  @IsEmail()
  @MaxLength(150)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Raw token from the password reset email' })
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  token!: string;

  @ApiProperty({ example: 'NewSecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Raw token from the verification email' })
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  token!: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty() sent!: boolean;
  @ApiProperty() message!: string;
}

export class ResendVerificationResponseDto {
  @ApiProperty() sent!: boolean;
  @ApiProperty() message!: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty() reset!: boolean;
  @ApiProperty() message!: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty() verified!: boolean;
  @ApiProperty() message!: string;
}
