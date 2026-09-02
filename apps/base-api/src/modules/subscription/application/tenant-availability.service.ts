import { Injectable } from '@nestjs/common';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import { EntitlementPolicyService } from './entitlement-policy.service.js';

@Injectable()
export class TenantAvailabilityService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly policy: EntitlementPolicyService,
  ) {}

  async list(tenantId: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    return {
      tenantId,
      applications: await this.policy.listAvailable(tenantId),
    };
  }

  async access(tenantId: string, applicationCode: string) {
    await this.tenantContext.ensureTenantExists(tenantId);
    return this.policy.evaluateAccess(tenantId, applicationCode);
  }
}
