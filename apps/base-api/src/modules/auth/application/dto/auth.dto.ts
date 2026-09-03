import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

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
  @ApiProperty() emailVerified!: boolean;
  @ApiPropertyOptional({ description: 'Resolved public URL for the profile picture' })
  avatarUrl?: string;
  @ApiProperty({
    example: ['TENANT_ADMIN'],
    type: [String],
    description: 'Platform roles plus active tenant membership roles (TENANT_ADMIN / TENANT_MEMBER)',
  })
  roles!: string[];
}

export class AuthTokenResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: string;
  @ApiProperty({ example: '15m' }) expiresIn!: string;
  @ApiProperty({ example: '7d' }) refreshExpiresIn!: string;
  @ApiProperty({ type: AuthUserResponseDto }) user!: AuthUserResponseDto;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  refreshToken!: string;
}
