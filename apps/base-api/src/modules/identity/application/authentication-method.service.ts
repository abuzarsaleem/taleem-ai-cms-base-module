import { Inject, Injectable } from '@nestjs/common';
import type { IAuthenticationMethodRepository } from '../domain/identity.repository.interface.js';
import { AUTHENTICATION_METHOD_REPOSITORY } from '../domain/identity.repository.interface.js';
import { AuthenticationMethodType } from '../domain/identity.types.js';

@Injectable()
export class AuthenticationMethodService {
  constructor(
    @Inject(AUTHENTICATION_METHOD_REPOSITORY)
    private readonly methods: IAuthenticationMethodRepository,
  ) {}

  /** Records that this identity can authenticate with its PASSWORD credential. */
  async ensurePassword(identityId: string, email?: string) {
    const existing = await this.methods.findByIdentityAndType(
      identityId,
      AuthenticationMethodType.PASSWORD,
    );
    if (existing) return existing;

    return this.methods.upsert({
      identityId,
      methodType: AuthenticationMethodType.PASSWORD,
      metadata: email ? { identifier: email.toLowerCase() } : null,
    });
  }

  findByProvider(methodType: string, providerReference: string) {
    return this.methods.findByProviderReference(methodType, providerReference);
  }

  ensureProvider(
    identityId: string,
    methodType: string,
    providerReference: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.methods.upsert({
      identityId,
      methodType,
      providerReference,
      metadata: metadata ?? null,
    });
  }
}
