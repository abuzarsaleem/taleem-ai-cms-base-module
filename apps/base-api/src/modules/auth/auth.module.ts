import { Module, forwardRef } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { OauthModule } from '../oauth/oauth.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { InvitationModule } from '../invitation/invitation.module.js';
import { UserIdentityEntity } from '../invitation/infrastructure/persistence/invitation.entities.js';
import { AuthService } from './application/auth.service.js';
import { AuthEmailService } from './application/auth-email.service.js';
import { AuthTokenService } from './application/auth-token.service.js';
import { UserVerificationService } from './application/user-verification.service.js';
import { UserProfileService } from './application/user-profile.service.js';
import { UserSessionService } from './application/user-session.service.js';
import { SocialAuthService } from './application/social-auth.service.js';
import { AuthController } from './presentation/auth.controller.js';
import { UserProfileController } from './presentation/user-profile.controller.js';
import { UserSessionController } from './presentation/user-session.controller.js';
import { SocialAuthController } from './presentation/social-auth.controller.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard.js';
import { UserTokenEntity } from './infrastructure/persistence/user-token.entity.js';
import { TypeOrmUserTokenRepository } from './infrastructure/persistence/typeorm-user-token.repository.js';
import { USER_TOKEN_REPOSITORY } from './domain/user-token.repository.interface.js';

@Module({
  imports: [
    UserModule,
    RbacModule,
    NotificationModule,
    StorageModule,
    forwardRef(() => OauthModule),
    forwardRef(() => InvitationModule),
    TypeOrmModule.forFeature([UserTokenEntity, UserIdentityEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn', '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    UserProfileController,
    UserSessionController,
    SocialAuthController,
  ],
  providers: [
    AuthService,
    AuthEmailService,
    AuthTokenService,
    UserVerificationService,
    UserProfileService,
    UserSessionService,
    SocialAuthService,
    JwtStrategy,
    {
      provide: USER_TOKEN_REPOSITORY,
      useClass: TypeOrmUserTokenRepository,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, AuthTokenService, JwtModule, USER_TOKEN_REPOSITORY],
})
export class AuthModule {}
