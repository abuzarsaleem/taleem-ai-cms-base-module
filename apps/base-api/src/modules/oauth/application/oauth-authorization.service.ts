import { randomUUID } from 'node:crypto';

import {

  BadRequestException,

  ForbiddenException,

  Inject,

  Injectable,

  UnauthorizedException,

} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { MembershipStatus } from '../../invitation/domain/membership.types.js';

import {

  TENANT_MEMBERSHIP_REPOSITORY,

  type ITenantMembershipRepository,

} from '../../invitation/domain/invitation.repository.interface.js';

import { APPLICATION_REPOSITORY } from '../../subscription/domain/subscription.repository.interface.js';

import type { IApplicationRepository } from '../../subscription/domain/subscription.repository.interface.js';

import { EntitlementPolicyService } from '../../subscription/application/entitlement-policy.service.js';

import {

  AUTHORIZATION_CODE_REPOSITORY,

  OAUTH_SESSION_REPOSITORY,

  type IAuthorizationCodeRepository,

  type IOAuthSessionRepository,

} from '../domain/oauth.repository.interface.js';

import { SessionStatus } from '../domain/oauth.types.js';

import type { OAuthAuthorizeQueryDto, OAuthConsentDto } from './dto/request/oauth.request.dto.js';

import { OauthAuditService } from './oauth-audit.service.js';

import { OauthClientService } from './oauth-client.service.js';

import { generateOpaqueToken, hashToken } from './oauth-token.util.js';



@Injectable()

export class OauthAuthorizationService {

  constructor(

    private readonly config: ConfigService,

    private readonly clientService: OauthClientService,

    private readonly auditService: OauthAuditService,

    private readonly entitlementPolicy: EntitlementPolicyService,

    @Inject(APPLICATION_REPOSITORY)

    private readonly applicationRepo: IApplicationRepository,

    @Inject(TENANT_MEMBERSHIP_REPOSITORY)

    private readonly membershipRepo: ITenantMembershipRepository,

    @Inject(OAUTH_SESSION_REPOSITORY)

    private readonly sessionRepo: IOAuthSessionRepository,

    @Inject(AUTHORIZATION_CODE_REPOSITORY)

    private readonly codeRepo: IAuthorizationCodeRepository,

  ) {}



  async previewAuthorize(userId: string, query: OAuthAuthorizeQueryDto) {

    if (query.response_type !== 'code') {

      throw new BadRequestException('Unsupported response_type');

    }



    const client = await this.clientService.getActiveClient(query.client_id);

    this.clientService.validateRedirectUri(client, query.redirect_uri);

    const normalizedScope = await this.clientService.validateScopes(client, query.scope);

    const scopes = await this.clientService.listScopes(client.applicationId);

    const applicationCode = await this.resolveApplicationCode(client.applicationId);



    const { data: memberships } = await this.membershipRepo.findByUser(userId, 1, 100);

    const activeTenants = memberships.filter(

      (m) => m.membershipStatus === MembershipStatus.ACTIVE,

    );



    if (activeTenants.length === 0) {

      throw new ForbiddenException('User has no active tenant memberships');

    }



    const entitledTenants = [];

    for (const tenant of activeTenants) {

      const access = await this.entitlementPolicy.evaluateAccess(tenant.tenantId, applicationCode);

      if (access.entitled) {

        entitledTenants.push(tenant);

      }

    }



    if (entitledTenants.length === 0) {

      throw new ForbiddenException(

        'None of your tenants are entitled to access this application',

      );

    }



    return {

      clientId: client.clientId,

      clientName: client.clientName,

      redirectUri: query.redirect_uri,

      scope: normalizedScope || query.scope,

      state: query.state,

      applicationCode,

      scopes: scopes.map((s) => ({

        scopeCode: s.scopeCode,

        name: s.name,

        description: s.description,

      })),

      tenants: entitledTenants.map((t) => ({

        tenantId: t.tenantId,

        tenantCode: t.tenantCode,

        displayName: t.tenantDisplayName,

      })),

    };

  }



  async submitConsent(

    userId: string,

    dto: OAuthConsentDto,

    ipAddress?: string,

    userAgent?: string,

  ) {

    const client = await this.clientService.getActiveClient(dto.client_id);

    this.clientService.validateRedirectUri(client, dto.redirect_uri);

    const normalizedScope = await this.clientService.validateScopes(client, dto.scope);

    const applicationCode = await this.resolveApplicationCode(client.applicationId);



    if (!dto.approved) {

      return {

        redirectUri: this.buildRedirect(dto.redirect_uri, {

          error: 'access_denied',

          state: dto.state,

        }),

      };

    }



    const membership = await this.membershipRepo.findByTenantAndUser(dto.tenant_id, userId);

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {

      throw new ForbiddenException('No active membership for selected tenant');

    }



    const access = await this.entitlementPolicy.evaluateAccess(dto.tenant_id, applicationCode);

    if (!access.entitled) {

      throw new ForbiddenException(

        access.reason ?? 'Tenant is not entitled to access this application',

      );

    }



    const sessionTtl = this.config.get<number>('oauth.sessionTtlSeconds', 604800);

    const session = await this.sessionRepo.create({

      sessionId: randomUUID(),

      userId,

      tenantId: dto.tenant_id,

      clientId: client.id,

      status: SessionStatus.ACTIVE,

      expiresAt: new Date(Date.now() + sessionTtl * 1000),

      ipAddress,

      userAgent,

    });



    const codeTtl = this.config.get<number>('oauth.authorizationCodeTtlSeconds', 300);

    const rawCode = generateOpaqueToken();

    await this.codeRepo.create({

      codeHash: hashToken(rawCode),

      clientId: client.id,

      userId,

      tenantId: dto.tenant_id,

      redirectUri: dto.redirect_uri,

      codeChallenge: dto.code_challenge,

      codeChallengeMethod: dto.code_challenge_method,

      scope: normalizedScope || dto.scope || 'openid profile',

      expiresAt: new Date(Date.now() + codeTtl * 1000),

    });



    await this.auditService.log({

      tenantId: dto.tenant_id,

      actorUserId: userId,

      action: 'OAUTH_CODE_ISSUED',

      entityType: 'oauth_client',

      entityId: client.id,

      newValue: { clientId: client.clientId, scope: normalizedScope || dto.scope, applicationCode },

      ipAddress,

    });



    return {

      redirectUri: this.buildRedirect(dto.redirect_uri, {

        code: rawCode,

        state: dto.state,

      }),

      code: rawCode,

      state: dto.state,

    };

  }



  private async resolveApplicationCode(applicationId: string): Promise<string> {

    const application = await this.applicationRepo.findById(applicationId);

    if (!application?.applicationCode) {

      throw new BadRequestException('OAuth client application is not configured');

    }

    return application.applicationCode;

  }



  private buildRedirect(base: string, params: Record<string, string | undefined>) {

    const url = new URL(base);

    for (const [key, value] of Object.entries(params)) {

      if (value !== undefined) url.searchParams.set(key, value);

    }

    return url.toString();

  }

}


