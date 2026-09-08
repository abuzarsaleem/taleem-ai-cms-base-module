import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AUTHENTICATION_METHOD_REPOSITORY,
  IDENTITY_REPOSITORY,
} from './domain/identity.repository.interface.js';
import {
  AuthenticationMethodEntity,
  IdentityCredentialEntity,
  IdentityEntity,
  IdentityIdentifierEntity,
  IdentityProfileEntity,
  IdentitySessionEntity,
} from './infrastructure/persistence/identity.entities.js';
import {
  TypeOrmAuthenticationMethodRepository,
  TypeOrmIdentityRepository,
} from './infrastructure/persistence/typeorm-identity.repository.js';
import { AuthenticationMethodService } from './application/authentication-method.service.js';
import { IdentityService } from './application/identity.service.js';

const entities = [
  IdentityEntity,
  IdentityProfileEntity,
  IdentityIdentifierEntity,
  IdentityCredentialEntity,
  AuthenticationMethodEntity,
  IdentitySessionEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [
    IdentityService,
    AuthenticationMethodService,
    {
      provide: IDENTITY_REPOSITORY,
      useClass: TypeOrmIdentityRepository,
    },
    {
      provide: AUTHENTICATION_METHOD_REPOSITORY,
      useClass: TypeOrmAuthenticationMethodRepository,
    },
  ],
  exports: [
    IdentityService,
    AuthenticationMethodService,
    IDENTITY_REPOSITORY,
    AUTHENTICATION_METHOD_REPOSITORY,
  ],
})
export class IdentityModule {}
