import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseScopeString } from './oauth-token.util.js';

/** Builds OIDC id_token claims when scope includes openid (no discovery/userinfo/jwks APIs). */
@Injectable()
export class OauthOidcService {
  constructor(private readonly config: ConfigService) {}

  buildIdToken(params: {
    userId: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
    tenantId?: string;
    clientId: string;
    scope: string;
    sign: (payload: Record<string, unknown>) => string;
  }) {
    const scopes = parseScopeString(params.scope);
    if (!scopes.includes('openid')) {
      return undefined;
    }

    // JwtService.sign applies expiresIn from module config; do not set exp/iat here.
    return params.sign({
      iss: this.getIssuer(),
      sub: params.userId,
      aud: params.clientId,
      email: params.email,
      email_verified: params.emailVerified,
      name: params.fullName,
      tenant_id: params.tenantId,
    });
  }

  private getIssuer() {
    return this.config.get<string>('oauth.issuer', 'http://localhost:3000/api/v1').replace(/\/$/, '');
  }
}
