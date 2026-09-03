import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OAuthScopeResponseDto {
  @ApiProperty() scopeCode!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
}

export class OAuthTenantOptionDto {
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty() tenantCode!: string;
  @ApiProperty() displayName!: string;
}

export class OAuthAuthorizePreviewResponseDto {
  @ApiProperty() clientId!: string;
  @ApiProperty() clientName!: string;
  @ApiProperty() redirectUri!: string;
  @ApiPropertyOptional() scope?: string;
  @ApiPropertyOptional() state?: string;
  @ApiProperty({ type: [OAuthScopeResponseDto] }) scopes!: OAuthScopeResponseDto[];
  @ApiProperty({ type: [OAuthTenantOptionDto] }) tenants!: OAuthTenantOptionDto[];
}

export class OAuthConsentResponseDto {
  @ApiProperty() redirectUri!: string;
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional() state?: string;
  @ApiPropertyOptional() error?: string;
}

export class OAuthTokenResponseDto {
  @ApiProperty() access_token!: string;
  @ApiProperty() token_type!: string;
  @ApiProperty() expires_in!: number;
  @ApiProperty() refresh_token!: string;
  @ApiPropertyOptional() scope?: string;
}

export class OAuthClientResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) applicationId!: string;
  @ApiProperty() clientId!: string;
  @ApiProperty() clientName!: string;
  @ApiProperty() clientType!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: [String] }) redirectUris!: string[];
}

export class CreateOAuthClientResponseDto extends OAuthClientResponseDto {
  @ApiPropertyOptional({ description: 'Plain client secret — only returned once at creation' })
  clientSecret?: string;
}
