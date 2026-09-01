import { UserProps } from '../domain/user.types.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: string): Promise<UserProps | null>;
  findByEmail(email: string): Promise<UserProps | null>;
  create(props: UserProps): Promise<UserProps>;
  update(id: string, props: Partial<UserProps>): Promise<UserProps>;
}
