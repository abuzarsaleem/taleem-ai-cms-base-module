import { Inject, Injectable } from '@nestjs/common';
import {
  TENANT_REPOSITORY,
  type ITenantRepository,
} from '../../tenant/domain/tenant.repository.interface.js';
import { TenantStatus } from '../../tenant/domain/tenant.types.js';
import {
  APPLICATION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type IApplicationRepository,
  type ITenantEntitlementRepository,
} from '../domain/subscription.repository.interface.js';
import { EntitlementStatus } from '../domain/subscription.types.js';
import { EntitlementPolicyService } from './entitlement-policy.service.js';

export type RegistrationTenantDto = {
  id: string;
  code: string;
  displayName: string;
};

@Injectable()
export class RegistrationTenantsService {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY)
    private readonly entitlements: ITenantEntitlementRepository,
    private readonly entitlementPolicy: EntitlementPolicyService,
  ) {}

  /**
   * ACTIVE institutions currently entitled to the given application (default ALUMNI).
   */
  async listForRegistration(
    applicationCode = 'ALUMNI',
  ): Promise<RegistrationTenantDto[]> {
    const application = await this.applications.findByCode(applicationCode);
    if (!application?.id) return [];

    const { data: entitlementRows } = await this.entitlements.findAll(1, 500, {
      applicationId: application.id,
      status: EntitlementStatus.ACTIVE,
    });

    const results: RegistrationTenantDto[] = [];
    const seen = new Set<string>();

    for (const entitlement of entitlementRows) {
      if (seen.has(entitlement.tenantId)) continue;
      seen.add(entitlement.tenantId);

      const access = await this.entitlementPolicy.evaluateAccess(
        entitlement.tenantId,
        applicationCode,
      );
      if (!access.entitled) continue;

      const tenant = await this.tenants.findById(entitlement.tenantId);
      if (!tenant || tenant.status !== TenantStatus.ACTIVE) continue;

      results.push({
        id: tenant.id!,
        code: tenant.tenantCode,
        displayName: tenant.displayName,
      });
    }

    results.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return results;
  }
}
