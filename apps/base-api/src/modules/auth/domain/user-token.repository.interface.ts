import type { UserTokenProps, UserTokenType } from './user-token.types.js';

export const USER_TOKEN_REPOSITORY = Symbol('USER_TOKEN_REPOSITORY');

export interface IUserTokenRepository {
  create(props: UserTokenProps): Promise<UserTokenProps>;
  update(id: string, props: Partial<UserTokenProps>): Promise<UserTokenProps>;
  findValidByHash(tokenHash: string, tokenType: UserTokenType): Promise<UserTokenProps | null>;
  findByTokenHash(tokenHash: string): Promise<UserTokenProps | null>;
  markUsed(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
  invalidatePendingForUser(userId: string, tokenType: UserTokenType): Promise<void>;
  revokeAllForUser(userId: string, tokenType: UserTokenType): Promise<void>;
  findByIdForUser(
    id: string,
    userId: string,
    tokenType: UserTokenType,
  ): Promise<UserTokenProps | null>;
  listActiveByUser(
    userId: string,
    tokenType: UserTokenType,
    page: number,
    limit: number,
  ): Promise<{ data: UserTokenProps[]; total: number }>;
  findInvitationsByTenant(
    tenantId: string,
    page: number,
    limit: number,
    membershipRole?: string,
  ): Promise<{ data: UserTokenProps[]; total: number }>;
  findInvitationById(tenantId: string, id: string): Promise<UserTokenProps | null>;
  findPendingInvitationByEmail(
    tenantId: string,
    email: string,
    membershipRole?: string,
  ): Promise<UserTokenProps | null>;
}

/** @deprecated Use USER_TOKEN_REPOSITORY */
export const VERIFICATION_TOKEN_REPOSITORY = USER_TOKEN_REPOSITORY;

/** @deprecated Use USER_TOKEN_REPOSITORY */
export const USER_REFRESH_TOKEN_REPOSITORY = USER_TOKEN_REPOSITORY;
