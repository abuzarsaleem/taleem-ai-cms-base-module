import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { InvitationModule } from '../invitation/invitation.module.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { UserModule } from '../user/user.module.js';
import { OauthAuditService } from './application/oauth-audit.service.js';
import { OauthAuthorizationService } from './application/oauth-authorization.service.js';
import { OauthClientService } from './application/oauth-client.service.js';
import { OauthOidcService } from './application/oauth-oidc.service.js';
import { OauthTokenService } from './application/oauth-token.service.js';
import {
  ApplicationEntity,
  ApplicationScopeEntity,
  AuditEventEntity,
  AuthorizationCodeEntity,
  OAuthClientEntity,
  OAuthSessionEntity,
  RefreshTokenEntity,
  RefreshTokenFamilyEntity,
} from './infrastructure/persistence/oauth.entities.js';
import { UserEntity } from '../user/infrastructure/persistence/user.entity.js';
import { oauthRepositories } from './infrastructure/persistence/typeorm-oauth.repositories.js';
import {
  OAUTH_SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
} from './domain/oauth.repository.interface.js';
import { OauthAuthorizationController } from './presentation/oauth-authorization.controller.js';
import { OauthClientController } from './presentation/oauth-client.controller.js';
import { OauthTokenController } from './presentation/oauth-token.controller.js';

const entities = [
  ApplicationEntity,
  ApplicationScopeEntity,
  OAuthClientEntity,
  OAuthSessionEntity,
  AuthorizationCodeEntity,
  RefreshTokenFamilyEntity,
  RefreshTokenEntity,
  AuditEventEntity,
  UserEntity,
];

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    forwardRef(() => AuthModule),
    UserModule,
    forwardRef(() => InvitationModule),
    SubscriptionModule,
  ],
  controllers: [
    OauthAuthorizationController,
    OauthTokenController,
    OauthClientController,
  ],
  providers: [
    OauthClientService,
    OauthAuthorizationService,
    OauthTokenService,
    OauthOidcService,
    OauthAuditService,
    ...oauthRepositories,
  ],
  exports: [
    OauthTokenService,
    OauthClientService,
    OAUTH_SESSION_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
  ],
})
export class OauthModule {}
