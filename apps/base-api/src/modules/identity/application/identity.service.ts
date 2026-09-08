import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IIdentityRepository } from '../domain/identity.repository.interface.js';
import { IDENTITY_REPOSITORY } from '../domain/identity.repository.interface.js';

@Injectable()
export class IdentityService {
  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IIdentityRepository,
  ) {}

  findByEmail(email: string) {
    return this.identityRepository.findByEmail(email);
  }

  async findById(id: string) {
    const identity = await this.identityRepository.findById(id);
    if (!identity) {
      throw new NotFoundException(`Identity '${id}' not found`);
    }
    return identity;
  }
}
