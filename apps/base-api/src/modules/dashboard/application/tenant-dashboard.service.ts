import { Inject, Injectable } from '@nestjs/common';
import {
  USER_TOKEN_REPOSITORY,
  type IUserTokenRepository,
} from '../../auth/domain/user-token.repository.interface.js';
import { UserTokenStatus } from '../../auth/domain/user-token.types.js';
import {
  TENANT_MEMBERSHIP_REPOSITORY,
  type ITenantMembershipRepository,
} from '../../invitation/domain/invitation.repository.interface.js';
import { MembershipRole } from '../../invitation/domain/membership.types.js';
import { toInvitationResponse } from '../../invitation/application/mappers/invitation.mapper.js';
import { toMembershipResponse } from '../../invitation/application/mappers/membership.mapper.js';
import { EntitlementPolicyService } from '../../subscription/application/entitlement-policy.service.js';
import {
  SUBSCRIPTION_REPOSITORY,
  TENANT_ENTITLEMENT_REPOSITORY,
  type ISubscriptionRepository,
  type ITenantEntitlementRepository,
} from '../../subscription/domain/subscription.repository.interface.js';
import {
  EntitlementStatus,
  SubscriptionStatus,
} from '../../subscription/domain/subscription.types.js';
import { TenantContextService } from '../../tenant/application/tenant-context.service.js';
import {
  TENANT_ADDRESS_REPOSITORY,
  TENANT_ASSET_REPOSITORY,
  TENANT_CONTACT_REPOSITORY,
  TENANT_IDENTIFIER_REPOSITORY,
  type ITenantAddressRepository,
  type ITenantAssetRepository,
  type ITenantContactRepository,
  type ITenantIdentifierRepository,
} from '../../tenant/domain/tenant.repository.interface.js';
import type { TenantDashboardResponseDto } from './dto/tenant-dashboard.response.dto.js';

const RECENT_LIMIT = 6;

@Injectable()
export class TenantDashboardService {
  constructor(
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly memberships: ITenantMembershipRepository,
    @Inject(USER_TOKEN_REPOSITORY)
    private readonly tokens: IUserTokenRepository,
    private readonly entitlementPolicy: EntitlementPolicyService,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: ISubscriptionRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY)
    private readonly entitlements: ITenantEntitlementRepository,
    @Inject(TENANT_CONTACT_REPOSITORY)
    private readonly contacts: ITenantContactRepository,
    @Inject(TENANT_ADDRESS_REPOSITORY)
    private readonly addresses: ITenantAddressRepository,
    @Inject(TENANT_IDENTIFIER_REPOSITORY)
    private readonly identifiers: ITenantIdentifierRepository,
    @Inject(TENANT_ASSET_REPOSITORY)
    private readonly assets: ITenantAssetRepository,
  ) {}

  async get(tenantId: string): Promise<TenantDashboardResponseDto> {
    await this.tenantContext.ensureTenantExists(tenantId);

    const [
      membersPage,
      pendingAdmin,
      pendingMember,
      availableApps,
      contactsPage,
      addressesPage,
      identifiersPage,
      assetsPage,
      subscriptionsTotal,
      subscriptionsActive,
      entitlementsTotal,
      entitlementsActive,
      recentInvitationsPage,
    ] = await Promise.all([
      this.memberships.findByTenant(tenantId, 1, RECENT_LIMIT),
      this.tokens.findAllInvitations(1, 1, MembershipRole.ADMIN, {
        tenantId,
        status: UserTokenStatus.PENDING,
      }),
      this.tokens.findAllInvitations(1, 1, MembershipRole.MEMBER, {
        tenantId,
        status: UserTokenStatus.PENDING,
      }),
      this.entitlementPolicy.listAvailable(tenantId),
      this.contacts.findByTenant(tenantId, 1, 1),
      this.addresses.findByTenant(tenantId, 1, 1),
      this.identifiers.findByTenant(tenantId, 1, 1),
      this.assets.findByTenant(tenantId, 1, 1),
      this.subscriptions.findAll(1, 1, { tenantId }),
      this.subscriptions.findAll(1, 1, {
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      }),
      this.entitlements.findAll(1, 1, { tenantId }),
      this.entitlements.findAll(1, 1, {
        tenantId,
        status: EntitlementStatus.ACTIVE,
      }),
      this.tokens.findInvitationsByTenant(tenantId, 1, RECENT_LIMIT),
    ]);

    const pendingAdminCount = pendingAdmin.total;
    const pendingMemberCount = pendingMember.total;
    const subscriptionActiveCount = subscriptionsActive.total;
    const subscriptionTotalCount = subscriptionsTotal.total;

    return {
      tenantId,
      membersCount: membersPage.total,
      pendingInvitations: {
        admin: pendingAdminCount,
        member: pendingMemberCount,
        total: pendingAdminCount + pendingMemberCount,
      },
      entitledApplicationsCount: availableApps.length,
      profile: {
        contacts: contactsPage.total,
        addresses: addressesPage.total,
        identifiers: identifiersPage.total,
        assets: assetsPage.total,
      },
      subscriptions: {
        total: subscriptionTotalCount,
        active: subscriptionActiveCount,
        inactive: Math.max(0, subscriptionTotalCount - subscriptionActiveCount),
      },
      entitlements: {
        total: entitlementsTotal.total,
        active: entitlementsActive.total,
      },
      recentMembers: membersPage.data.map(toMembershipResponse),
      recentInvitations: recentInvitationsPage.data.map(toInvitationResponse),
    };
  }
}
