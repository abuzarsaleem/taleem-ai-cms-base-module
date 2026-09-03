import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { CodeChallengeMethod } from '../../../domain/oauth.types.js';

export class OAuthAuthorizeQueryDto {
  @ApiProperty({ example: 'alumni-web' })
  @IsString()
  @MaxLength(100)
  client_id!: string;

  @ApiProperty({ example: 'code' })
  @IsString()
  response_type!: string;

  @ApiProperty({ example: 'http://localhost:3001/callback' })
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  redirect_uri!: string;

  @ApiPropertyOptional({ example: 'openid profile tenant.read' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  state?: string;

  @ApiProperty()
  @IsString()
  @MinLength(43)
  @MaxLength(128)
  code_challenge!: string;

  @ApiProperty({ enum: CodeChallengeMethod, default: CodeChallengeMethod.S256 })
  @IsEnum(CodeChallengeMethod)
  code_challenge_method!: CodeChallengeMethod;
}

export class OAuthConsentDto {
  @ApiProperty()
  @IsString()
  client_id!: string;

  @ApiProperty()
  @IsUrl({ require_tld: false })
  redirect_uri!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty()
  @IsString()
  code_challenge!: string;

  @ApiProperty({ enum: CodeChallengeMethod })
  @IsEnum(CodeChallengeMethod)
  code_challenge_method!: CodeChallengeMethod;

  @ApiProperty({ format: 'uuid' })
  @IsString()
  tenant_id!: string;

  @ApiProperty()
  @IsBoolean()
  approved!: boolean;
}

export class OAuthTokenRequestDto {
  @ApiProperty({ enum: ['authorization_code', 'refresh_token'] })
  @IsString()
  grant_type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  redirect_uri?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_secret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code_verifier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refresh_token?: string;
}

export class OAuthRevokeDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiPropertyOptional({ enum: ['access_token', 'refresh_token'] })
  @IsOptional()
  @IsString()
  token_type_hint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_secret?: string;
}

export class CreateOAuthClientDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  application_id!: string;

  @ApiProperty({ example: 'alumni-web' })
  @IsString()
  @MaxLength(100)
  client_id!: string;

  @ApiProperty({ example: 'Alumni Portal' })
  @IsString()
  @MaxLength(150)
  client_name!: string;

  @ApiProperty({ enum: ['PUBLIC', 'CONFIDENTIAL'] })
  @IsString()
  client_type!: string;

  @ApiProperty({ type: [String], example: ['http://localhost:3001/callback'] })
  redirect_uris!: string[];

  @ApiPropertyOptional({ description: 'Required for CONFIDENTIAL clients' })
  @IsOptional()
  @IsString()
  @MinLength(16)
  client_secret?: string;
}
