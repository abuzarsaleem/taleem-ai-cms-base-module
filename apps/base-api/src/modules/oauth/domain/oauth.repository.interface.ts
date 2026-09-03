import type { OAuthClientType } from './oauth.types.js';

export const OAUTH_CLIENT_REPOSITORY = Symbol('OAUTH_CLIENT_REPOSITORY');
export const APPLICATION_SCOPE_REPOSITORY = Symbol('APPLICATION_SCOPE_REPOSITORY');
export const AUTHORIZATION_CODE_REPOSITORY = Symbol('AUTHORIZATION_CODE_REPOSITORY');
export const OAUTH_SESSION_REPOSITORY = Symbol('OAUTH_SESSION_REPOSITORY');
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
export const OAUTH_AUDIT_REPOSITORY = Symbol('OAUTH_AUDIT_REPOSITORY');

export interface OAuthClientProps {
  id: string;
  applicationId: string;
  clientId: string;
  clientName: string;
  clientType: OAuthClientType | string;
  clientSecretHash?: string;
  status: string;
  redirectUris: string[];
}

export interface ApplicationScopeProps {
  id: string;
  applicationId: string;
  scopeCode: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AuthorizationCodeProps {
  id?: string;
  codeHash: string;
  clientId: string;
  userId: string;
  tenantId?: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  expiresAt: Date;
}

export interface OAuthSessionProps {
  id?: string;
  sessionId: string;
  userId: string;
  tenantId?: string;
  clientId: string;
  status: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenFamilyProps {
  id?: string;
  sessionId: string;
  userId: string;
  tenantId?: string;
  status: string;
}

export interface RefreshTokenProps {
  id?: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface OAuthAuditEventProps {
  tenantId?: string;
  actorUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
}

export interface StoredAuthorizationCode extends AuthorizationCodeProps {
  id: string;
  usedAt?: Date;
}

export interface StoredRefreshToken extends RefreshTokenProps {
  id: string;
  usedAt?: Date;
  revokedAt?: Date;
  familyStatus: string;
  sessionId: string;
  userId: string;
  tenantId?: string;
  clientId: string;
  scope: string;
  email: string;
}

export interface IOAuthClientRepository {
  findByClientId(clientId: string): Promise<OAuthClientProps | null>;
  findById(id: string): Promise<OAuthClientProps | null>;
  list(page: number, limit: number): Promise<{ data: OAuthClientProps[]; total: number }>;
  create(props: Omit<OAuthClientProps, 'id'> & { clientSecretHash?: string }): Promise<OAuthClientProps>;
}

export interface IApplicationScopeRepository {
  findActiveByApplication(applicationId: string): Promise<ApplicationScopeProps[]>;
  validateScopes(applicationId: string, scopes: string[]): Promise<boolean>;
}

export interface IAuthorizationCodeRepository {
  create(props: AuthorizationCodeProps): Promise<StoredAuthorizationCode>;
  findByCodeHash(codeHash: string): Promise<StoredAuthorizationCode | null>;
  markUsed(id: string): Promise<void>;
}

export interface OAuthSessionSummary extends OAuthSessionProps {
  id: string;
  clientName?: string;
  createdAt?: Date;
}

export interface IOAuthSessionRepository {
  create(props: OAuthSessionProps): Promise<OAuthSessionProps & { id: string }>;
  findBySessionId(sessionId: string): Promise<(OAuthSessionProps & { id: string }) | null>;
  findActiveForGrant(
    userId: string,
    clientId: string,
    tenantId?: string,
  ): Promise<(OAuthSessionProps & { id: string }) | null>;
  findByIdForUser(id: string, userId: string): Promise<(OAuthSessionProps & { id: string }) | null>;
  listByUser(userId: string, page: number, limit: number): Promise<{ data: OAuthSessionSummary[]; total: number }>;
  revoke(id: string, reason?: string): Promise<void>;
}

export interface IRefreshTokenRepository {
  createFamily(props: RefreshTokenFamilyProps): Promise<RefreshTokenFamilyProps & { id: string }>;
  createToken(props: RefreshTokenProps): Promise<StoredRefreshToken>;
  findByTokenHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  markUsed(id: string, replacedById?: string): Promise<void>;
  revokeFamily(familyId: string, status: string, reason?: string): Promise<void>;
  revokeToken(id: string): Promise<void>;
  revokeFamiliesBySessionId(sessionId: string, reason?: string): Promise<void>;
}

export interface IOAuthAuditRepository {
  create(props: OAuthAuditEventProps): Promise<void>;
}
