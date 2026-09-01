import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ITenantRepository } from '../domain/tenant.repository.interface.js';
import { TENANT_REPOSITORY } from '../domain/tenant.repository.interface.js';

@Injectable()
export class TenantContextService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async ensureTenantExists(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }
  }
}
