import type { UserRefreshTokenProps } from './refresh-token.types.js';

export const USER_REFRESH_TOKEN_REPOSITORY = Symbol('USER_REFRESH_TOKEN_REPOSITORY');

export interface IUserRefreshTokenRepository {
  create(props: UserRefreshTokenProps): Promise<UserRefreshTokenProps>;
  findValidByHash(tokenHash: string): Promise<UserRefreshTokenProps | null>;
  findByIdForUser(id: string, userId: string): Promise<UserRefreshTokenProps | null>;
  listActiveByUser(userId: string, page: number, limit: number): Promise<{ data: UserRefreshTokenProps[]; total: number }>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
