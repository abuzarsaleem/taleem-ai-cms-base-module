import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import { APPLICATION_REPOSITORY } from '../../subscription/domain/subscription.repository.interface.js';
import type { IApplicationRepository } from '../../subscription/domain/subscription.repository.interface.js';
import { EntitlementPolicyService } from '../../subscription/application/entitlement-policy.service.js';
import {
  AUTHORIZATION_CODE_REPOSITORY,
  OAUTH_CLIENT_REPOSITORY,
  OAUTH_SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  type IAuthorizationCodeRepository,
  type IOAuthClientRepository,
  type IOAuthSessionRepository,
  type IRefreshTokenRepository,
} from '../domain/oauth.repository.interface.js';
import { OAuthGrantType, RefreshFamilyStatus, SessionStatus } from '../domain/oauth.types.js';
import type { OAuthRevokeDto, OAuthTokenRequestDto } from './dto/request/oauth.request.dto.js';
import { OauthOidcService } from './oauth-oidc.service.js';
import { OauthAuditService } from './oauth-audit.service.js';
import { OauthClientService } from './oauth-client.service.js';
import {
  generateOpaqueToken,
  hashToken,
  parseExpiresIn,
  verifyPkce,
} from './oauth-token.util.js';

@Injectable()
export class OauthTokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly clientService: OauthClientService,
    private readonly auditService: OauthAuditService,
    private readonly oidcService: OauthOidcService,
    private readonly entitlementPolicy: EntitlementPolicyService,
    @Inject(OAUTH_CLIENT_REPOSITORY) private readonly clientRepo: IOAuthClientRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepo: IApplicationRepository,
    @Inject(AUTHORIZATION_CODE_REPOSITORY)
    private readonly codeRepo: IAuthorizationCodeRepository,
    @Inject(OAUTH_SESSION_REPOSITORY)
    private readonly sessionRepo: IOAuthSessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: IRefreshTokenRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async token(dto: OAuthTokenRequestDto, ipAddress?: string) {
    if (dto.grant_type === OAuthGrantType.AUTHORIZATION_CODE) {
      return this.exchangeAuthorizationCode(dto, ipAddress);
    }
    if (dto.grant_type === OAuthGrantType.REFRESH_TOKEN) {
      return this.refreshAccessToken(dto, ipAddress);
    }
    throw new BadRequestException('Unsupported grant_type');
  }

  async revoke(dto: OAuthRevokeDto) {
    if (!dto.client_id) return;
    const client = await this.clientService.getActiveClient(dto.client_id);
    await this.clientService.validateClientAuth(client, dto.client_secret);

    const tokenHash = hashToken(dto.token);
    const refresh = await this.refreshRepo.findByTokenHash(tokenHash);
    if (refresh) {
      await this.refreshRepo.revokeToken(refresh.id);
      await this.refreshRepo.revokeFamily(refresh.familyId, RefreshFamilyStatus.REVOKED, 'revoked');
      await this.sessionRepo.revoke(refresh.sessionId, 'token_revoked');
      return;
    }

    await this.auditService.log({
      action: 'OAUTH_TOKEN_REVOKED',
      newValue: { tokenTypeHint: dto.token_type_hint ?? 'unknown' },
    });
  }

  private async exchangeAuthorizationCode(dto: OAuthTokenRequestDto, ipAddress?: string) {
    if (!dto.code || !dto.redirect_uri || !dto.client_id || !dto.code_verifier) {
      throw new BadRequestException('Missing required parameters');
    }

    const client = await this.clientService.getActiveClient(dto.client_id);
    await this.clientService.validateClientAuth(client, dto.client_secret);
    this.clientService.validateRedirectUri(client, dto.redirect_uri);

    const codeHash = hashToken(dto.code);
    const authCode = await this.codeRepo.findByCodeHash(codeHash);
    if (!authCode) throw new BadRequestException('Invalid authorization code');
    if (authCode.usedAt) throw new BadRequestException('Authorization code already used');
    if (authCode.expiresAt <= new Date()) throw new BadRequestException('Authorization code expired');
    if (authCode.clientId !== client.id) throw new BadRequestException('Authorization code client mismatch');
    if (authCode.redirectUri !== dto.redirect_uri) {
      throw new BadRequestException('redirect_uri mismatch');
    }
    if (!verifyPkce(dto.code_verifier, authCode.codeChallenge)) {
      throw new BadRequestException('Invalid code_verifier');
    }

    const user = await this.userRepo.findById(authCode.userId);
    if (!user?.id) throw new UnauthorizedException('User not found');

    const application = await this.applicationRepo.findById(client.applicationId);
    if (application?.applicationCode && authCode.tenantId) {
      const access = await this.entitlementPolicy.evaluateAccess(
        authCode.tenantId,
        application.applicationCode,
      );
      if (!access.entitled) {
        throw new ForbiddenException(
          access.reason ?? 'Tenant is not entitled to access this application',
        );
      }
    }

    await this.codeRepo.markUsed(authCode.id);

    const session = await this.sessionRepo.findActiveForGrant(
      authCode.userId,
      client.id,
      authCode.tenantId,
    );
    const sessionDbId = session?.id;
    if (!sessionDbId) {
      throw new BadRequestException('OAuth session not found');
    }

    const family = await this.refreshRepo.createFamily({
      sessionId: sessionDbId,
      userId: authCode.userId,
      tenantId: authCode.tenantId,
      status: RefreshFamilyStatus.ACTIVE,
    });

    const tokens = await this.issueTokenPair({
      userId: authCode.userId,
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified ?? false,
      tenantId: authCode.tenantId,
      clientId: client.clientId,
      clientDbId: client.id,
      scope: authCode.scope,
      sessionDbId,
      familyId: family.id!,
    });

    await this.auditService.log({
      tenantId: authCode.tenantId,
      actorUserId: authCode.userId,
      action: 'OAUTH_TOKEN_ISSUED',
      entityType: 'oauth_client',
      entityId: client.id,
      newValue: { grantType: OAuthGrantType.AUTHORIZATION_CODE },
      ipAddress,
    });

    return tokens;
  }

  private async refreshAccessToken(dto: OAuthTokenRequestDto, ipAddress?: string) {
    if (!dto.refresh_token || !dto.client_id) {
      throw new BadRequestException('Missing refresh_token or client_id');
    }

    const client = await this.clientService.getActiveClient(dto.client_id);
    await this.clientService.validateClientAuth(client, dto.client_secret);

    const tokenHash = hashToken(dto.refresh_token);
    const stored = await this.refreshRepo.findByTokenHash(tokenHash);
    if (!stored) throw new BadRequestException('Invalid refresh_token');

    if (stored.familyStatus === RefreshFamilyStatus.BREACH_SUSPECTED) {
      throw new UnauthorizedException('Refresh token family revoked due to suspected breach');
    }

    if (stored.usedAt) {
      await this.refreshRepo.revokeFamily(
        stored.familyId,
        RefreshFamilyStatus.BREACH_SUSPECTED,
        'refresh_token_reuse',
      );
      await this.sessionRepo.revoke(stored.sessionId, 'refresh_token_reuse');
      await this.auditService.log({
        tenantId: stored.tenantId,
        actorUserId: stored.userId,
        action: 'OAUTH_REFRESH_REUSE_DETECTED',
        entityType: 'refresh_token_family',
        entityId: stored.familyId,
        ipAddress,
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new BadRequestException('Refresh token expired or revoked');
    }

    const oauthClient = await this.clientRepo.findById(stored.clientId);
    if (!oauthClient || oauthClient.clientId !== client.clientId) {
      throw new BadRequestException('Refresh token client mismatch');
    }

    const newRefreshRaw = generateOpaqueToken();
    const newRefresh = await this.refreshRepo.createToken({
      familyId: stored.familyId,
      tokenHash: hashToken(newRefreshRaw),
      expiresAt: stored.expiresAt,
    });

    await this.refreshRepo.markUsed(stored.id, newRefresh.id);

    const user = await this.userRepo.findById(stored.userId);

    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn', '15m');
    const accessToken = this.signAccessToken({
      sub: stored.userId,
      email: stored.email,
      tenantId: stored.tenantId,
      clientId: client.clientId,
      scope: stored.scope,
      sessionId: stored.sessionId,
    });

    const idToken = user
      ? this.oidcService.buildIdToken({
          userId: stored.userId,
          email: stored.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified ?? false,
          tenantId: stored.tenantId,
          clientId: client.clientId,
          scope: stored.scope,
          sign: (payload) => this.jwtService.sign(payload),
        })
      : undefined;

    await this.auditService.log({
      tenantId: stored.tenantId,
      actorUserId: stored.userId,
      action: 'OAUTH_TOKEN_REFRESHED',
      entityType: 'refresh_token_family',
      entityId: stored.familyId,
      ipAddress,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: parseExpiresIn(accessExpiresIn),
      refresh_token: newRefreshRaw,
      scope: stored.scope,
      ...(idToken ? { id_token: idToken } : {}),
    };
  }

  private async issueTokenPair(params: {
    userId: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
    tenantId?: string;
    clientId: string;
    clientDbId: string;
    scope: string;
    sessionDbId: string;
    familyId: string;
  }) {
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '7d');
    const refreshTtlSeconds = parseExpiresIn(refreshExpiresIn);
    const refreshRaw = generateOpaqueToken();

    await this.refreshRepo.createToken({
      familyId: params.familyId,
      tokenHash: hashToken(refreshRaw),
      expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
    });

    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn', '15m');
    const accessToken = this.signAccessToken({
      sub: params.userId,
      email: params.email,
      tenantId: params.tenantId,
      clientId: params.clientId,
      scope: params.scope,
      sessionId: params.sessionDbId,
    });

    const idToken = this.oidcService.buildIdToken({
      userId: params.userId,
      email: params.email,
      fullName: params.fullName,
      emailVerified: params.emailVerified,
      tenantId: params.tenantId,
      clientId: params.clientId,
      scope: params.scope,
      sign: (payload) => this.jwtService.sign(payload),
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: parseExpiresIn(accessExpiresIn),
      refresh_token: refreshRaw,
      scope: params.scope,
      ...(idToken ? { id_token: idToken } : {}),
    };
  }

  private signAccessToken(payload: {
    sub: string;
    email: string;
    tenantId?: string;
    clientId: string;
    scope: string;
    sessionId: string;
  }) {
    return this.jwtService.sign({
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      clientId: payload.clientId,
      scope: payload.scope,
      sessionId: payload.sessionId,
      type: 'oauth',
    });
  }
}
