import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface.js';
import { USER_REPOSITORY } from '../domain/user.repository.interface.js';
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }
    return user;
  }
}
