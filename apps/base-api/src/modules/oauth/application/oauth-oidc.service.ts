import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseExpiresIn, parseScopeString } from './oauth-token.util.js';

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

    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn', '15m');
    const now = Math.floor(Date.now() / 1000);

    return params.sign({
      iss: this.getIssuer(),
      sub: params.userId,
      aud: params.clientId,
      email: params.email,
      email_verified: params.emailVerified,
      name: params.fullName,
      tenant_id: params.tenantId,
      iat: now,
      exp: now + parseExpiresIn(accessExpiresIn),
    });
  }

  private getIssuer() {
    return this.config.get<string>('oauth.issuer', 'http://localhost:3000/api/v1').replace(/\/$/, '');
  }
}
