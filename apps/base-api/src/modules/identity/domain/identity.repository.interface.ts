import type {
  AuthenticationMethodProps,
  IdentityListFilters,
  IdentityProps,
} from './identity.types.js';

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');

export interface IIdentityRepository {
  findById(id: string): Promise<IdentityProps | null>;
  findByEmail(email: string): Promise<IdentityProps | null>;
  findAll(
    page: number,
    limit: number,
    filters?: IdentityListFilters,
  ): Promise<{ data: IdentityProps[]; total: number }>;
  create(props: IdentityProps): Promise<IdentityProps>;
  update(id: string, props: Partial<IdentityProps>): Promise<IdentityProps>;
  updateLastLogin(id: string): Promise<void>;
}

export const AUTHENTICATION_METHOD_REPOSITORY = Symbol('AUTHENTICATION_METHOD_REPOSITORY');

export interface IAuthenticationMethodRepository {
  findByIdentityAndType(
    identityId: string,
    methodType: string,
  ): Promise<AuthenticationMethodProps | null>;
  findByProviderReference(
    methodType: string,
    providerReference: string,
  ): Promise<AuthenticationMethodProps | null>;
  upsert(props: AuthenticationMethodProps): Promise<AuthenticationMethodProps>;
}
