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
import { UserVerificationTokenEntity } from './infrastructure/persistence/verification.entity.js';
import { UserRefreshTokenEntity } from './infrastructure/persistence/refresh-token.entity.js';
import { TypeOrmVerificationTokenRepository } from './infrastructure/persistence/typeorm-verification.repository.js';
import { TypeOrmUserRefreshTokenRepository } from './infrastructure/persistence/typeorm-refresh-token.repository.js';
import { VERIFICATION_TOKEN_REPOSITORY } from './domain/verification.repository.interface.js';
import { USER_REFRESH_TOKEN_REPOSITORY } from './domain/refresh-token.repository.interface.js';

@Module({
  imports: [
    UserModule,
    RbacModule,
    NotificationModule,
    StorageModule,
    forwardRef(() => OauthModule),
    TypeOrmModule.forFeature([
      UserVerificationTokenEntity,
      UserRefreshTokenEntity,
      UserIdentityEntity,
    ]),
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
      provide: VERIFICATION_TOKEN_REPOSITORY,
      useClass: TypeOrmVerificationTokenRepository,
    },
    {
      provide: USER_REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmUserRefreshTokenRepository,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, AuthTokenService, JwtModule, USER_REFRESH_TOKEN_REPOSITORY],
})
export class AuthModule {}
