import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'admin@taleem.ai' })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Platform Admin' })
  @IsString()
  @MaxLength(150)
  fullName!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@taleem.ai' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password!: string;
}

class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty({ example: ['PLATFORM_ADMIN'], type: [String] }) roles!: string[];
  @ApiProperty({ example: ['platform.tenant.create'], type: [String] }) permissions!: string[];
}

export class AuthTokenResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: string;
  @ApiProperty({ example: '15m' }) expiresIn!: string;
  @ApiProperty({ type: AuthUserResponseDto }) user!: AuthUserResponseDto;
}
