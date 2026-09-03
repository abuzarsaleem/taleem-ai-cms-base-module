import { UserProps, UserListFilters } from '../domain/user.types.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: string): Promise<UserProps | null>;
  findByEmail(email: string): Promise<UserProps | null>;
  findAll(
    page: number,
    limit: number,
    filters?: UserListFilters,
  ): Promise<{ data: UserProps[]; total: number }>;
  create(props: UserProps): Promise<UserProps>;
  update(id: string, props: Partial<UserProps>): Promise<UserProps>;
  updateLastLogin(id: string): Promise<void>;
}
