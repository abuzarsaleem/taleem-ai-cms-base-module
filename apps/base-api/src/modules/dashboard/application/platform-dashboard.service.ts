import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DATABASE_SCHEMA } from '@app/common';
import {
  USER_TOKEN_REPOSITORY,
  type IUserTokenRepository,
} from '../../auth/domain/user-token.repository.interface.js';
import { UserTokenStatus } from '../../auth/domain/user-token.types.js';
import { MembershipRole } from '../../invitation/domain/membership.types.js';
import { ApplicationCatalogService } from '../../subscription/application/application-catalog.service.js';
import { AuditQueryService } from '../../subscription/application/audit-query.service.js';
import { TenantService } from '../../tenant/application/tenant.service.js';
import { TenantConfigurationService } from '../../tenant/application/tenant-sub-resource.services.js';
import { TenantStatus } from '../../tenant/domain/tenant.types.js';
import type { PlatformDashboardLimitQueryDto } from './dto/platform-dashboard.request.dto.js';
import {
  PlatformComponentStatus,
  type PlatformDashboardActivityResponseDto,
  type PlatformDashboardApplicationsResponseDto,
  type PlatformDashboardAttentionResponseDto,
  type PlatformDashboardCountsResponseDto,
  type PlatformDashboardRecentTenantsResponseDto,
  type PlatformDashboardSystemStatusResponseDto,
} from './dto/platform-dashboard.response.dto.js';

const DEFAULT_LIMIT = 6;

@Injectable()
export class PlatformDashboardService {
  constructor(
    private readonly tenants: TenantService,
    private readonly configurations: TenantConfigurationService,
    private readonly applications: ApplicationCatalogService,
    private readonly auditQuery: AuditQueryService,
    private readonly config: ConfigService,
    @Inject(USER_TOKEN_REPOSITORY)
    private readonly tokens: IUserTokenRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getCounts(): Promise<PlatformDashboardCountsResponseDto> {
    const [tenantStats, appStats] = await Promise.all([
      this.tenants.getCatalogueStats(),
      this.applications.getCatalogueStats(),
    ]);

    return {
      tenants: {
        value: tenantStats.total,
        vsPreviousMonth: tenantStats.vsPreviousMonth.total,
      },
      activeTenants: {
        value: tenantStats.active,
        vsPreviousMonth: tenantStats.vsPreviousMonth.active,
      },
      onboarding: {
        value: tenantStats.onboarding,
        vsPreviousMonth: tenantStats.vsPreviousMonth.onboarding,
      },
      applications: {
        value: appStats.total,
        vsPreviousMonth: appStats.vsPreviousMonth.total,
      },
    };
  }

  async getAttention(): Promise<PlatformDashboardAttentionResponseDto> {
    const [
      tenantsAwaitingActivation,
      integrationConfigurationsIncomplete,
      oauthClientsExpiringSoon,
      onboardingTasksPending,
    ] = await Promise.all([
      this.countTenantsByStatus(TenantStatus.ONBOARDING),
      this.configurations.countIncomplete(),
      this.countOauthClientsExpiringSoon(),
      this.countPendingInvitations(),
    ]);

    const items = [
      {
        key: 'tenantsAwaitingActivation',
        label: 'Tenants awaiting activation',
        count: tenantsAwaitingActivation,
      },
      {
        key: 'integrationConfigurationsIncomplete',
        label: 'Integration configurations incomplete',
        count: integrationConfigurationsIncomplete,
      },
      {
        key: 'oauthClientsExpiringSoon',
        label: 'OAuth clients expiring soon',
        count: oauthClientsExpiringSoon,
      },
      {
        key: 'onboardingTasksPending',
        label: 'Onboarding tasks pending',
        count: onboardingTasksPending,
      },
    ];

    return {
      items,
      total: items.reduce((sum, item) => sum + item.count, 0),
    };
  }

  async getApplications(
    query: PlatformDashboardLimitQueryDto,
  ): Promise<PlatformDashboardApplicationsResponseDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const page = await this.applications.findAll(1, limit);
    return { data: page.data };
  }

  async getRecentTenants(
    query: PlatformDashboardLimitQueryDto,
  ): Promise<PlatformDashboardRecentTenantsResponseDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const page = await this.tenants.findAll(1, limit);
    const logoByTenantId = await this.tenants.resolveLogoUrlsByTenantIds(page.data.map((t) => t.id));

    return {
      data: page.data.map((tenant) => {
        const logos = logoByTenantId.get(tenant.id);
        return {
          id: tenant.id,
          displayName: tenant.displayName,
          tenantCode: tenant.tenantCode,
          status: tenant.status,
          joinedAt: tenant.createdAt,
          logoUrl: logos?.logoUrl,
          logoDarkUrl: logos?.logoDarkUrl,
        };
      }),
    };
  }

  async getActivity(
    query: PlatformDashboardLimitQueryDto,
  ): Promise<PlatformDashboardActivityResponseDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const page = await this.auditQuery.search({}, 1, limit);
    return {
      data: page.data.map((event) => ({
        id: event.id!,
        action: event.action,
        summary: this.summarizeAuditAction(event.action, event.entityType),
        tenantId: event.tenantId,
        actorUserId: event.actorUserId,
        entityType: event.entityType,
        entityId: event.entityId,
        createdAt: event.createdAt!,
      })),
    };
  }

  async getSystemStatus(): Promise<PlatformDashboardSystemStatusResponseDto> {
    const checkedAt = new Date().toISOString();
    const database = await this.checkDatabase();
    const fileStorage = this.checkFileStorageConfigured();
    const smtpService = this.checkSmtpConfigured();

    const components = [
      {
        key: 'platformApi',
        label: 'Platform API',
        status: PlatformComponentStatus.OPERATIONAL,
      },
      {
        key: 'database',
        label: 'Database',
        status: database.status,
        detail: database.detail,
      },
      {
        key: 'fileStorage',
        label: 'File Storage',
        status: fileStorage.status,
        detail: fileStorage.detail,
      },
      {
        key: 'smtpService',
        label: 'SMTP Service',
        status: smtpService.status,
        detail: smtpService.detail,
      },
      {
        key: 'lmsIntegration',
        label: 'LMS Integration',
        status: PlatformComponentStatus.UNKNOWN,
        detail: 'Not configured in base module',
      },
      {
        key: 'paymentGateway',
        label: 'Payment Gateway',
        status: PlatformComponentStatus.UNKNOWN,
        detail: 'Not configured in base module',
      },
    ];

    return {
      overall: this.overallStatus(components.map((c) => c.status)),
      components,
      checkedAt,
    };
  }

  private async countTenantsByStatus(status: TenantStatus): Promise<number> {
    const [{ count }] = await this.dataSource.query(
      `
      SELECT COUNT(*)::int AS count
      FROM "${DATABASE_SCHEMA}".tenants
      WHERE status = $1
      `,
      [status],
    );
    return Number(count);
  }

  /**
   * Client secret expiry is not stored. Surface ACTIVE clients with empty
   * redirect_uris as incomplete OAuth setup (closest operational signal).
   */
  private async countOauthClientsExpiringSoon(): Promise<number> {
    try {
      const [{ count }] = await this.dataSource.query(
        `
        SELECT COUNT(*)::int AS count
        FROM "${DATABASE_SCHEMA}".oauth_clients c
        WHERE c.status = 'ACTIVE'
          AND COALESCE(jsonb_array_length(c.redirect_uris), 0) = 0
        `,
      );
      return Number(count);
    } catch {
      return 0;
    }
  }

  private async countPendingInvitations(): Promise<number> {
    const [admin, member] = await Promise.all([
      this.tokens.findAllInvitations(1, 1, MembershipRole.ADMIN, {
        status: UserTokenStatus.PENDING,
      }),
      this.tokens.findAllInvitations(1, 1, MembershipRole.MEMBER, {
        status: UserTokenStatus.PENDING,
      }),
    ]);
    return admin.total + member.total;
  }

  private async checkDatabase(): Promise<{
    status: PlatformComponentStatus;
    detail?: string;
  }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: PlatformComponentStatus.OPERATIONAL };
    } catch (error) {
      return {
        status: PlatformComponentStatus.DOWN,
        detail: error instanceof Error ? error.message : 'Database unreachable',
      };
    }
  }

  private checkFileStorageConfigured(): {
    status: PlatformComponentStatus;
    detail?: string;
  } {
    const accessKey = this.config.get<string>('storage.s3.accessKey') ?? '';
    const secretKey = this.config.get<string>('storage.s3.secretKey') ?? '';
    const bucket = this.config.get<string>('storage.s3.bucket') ?? '';
    if (accessKey && secretKey && bucket) {
      return { status: PlatformComponentStatus.OPERATIONAL };
    }
    return {
      status: PlatformComponentStatus.DEGRADED,
      detail: 'S3 credentials or bucket not fully configured',
    };
  }

  private checkSmtpConfigured(): {
    status: PlatformComponentStatus;
    detail?: string;
  } {
    const apiKey = this.config.get<string>('brevo.apiKey') ?? '';
    if (apiKey) {
      return { status: PlatformComponentStatus.OPERATIONAL };
    }
    return {
      status: PlatformComponentStatus.DEGRADED,
      detail: 'BREVO_API_KEY not configured',
    };
  }

  private overallStatus(statuses: PlatformComponentStatus[]): PlatformComponentStatus {
    if (statuses.includes(PlatformComponentStatus.DOWN)) {
      return PlatformComponentStatus.DOWN;
    }
    if (statuses.includes(PlatformComponentStatus.DEGRADED)) {
      return PlatformComponentStatus.DEGRADED;
    }
    if (statuses.every((s) => s === PlatformComponentStatus.UNKNOWN)) {
      return PlatformComponentStatus.UNKNOWN;
    }
    return PlatformComponentStatus.OPERATIONAL;
  }

  private summarizeAuditAction(action: string, entityType?: string): string {
    const map: Record<string, string> = {
      APPLICATION_CREATED: 'New application registered',
      APPLICATION_UPDATED: 'Application updated',
      APPLICATION_DEACTIVATED: 'Application deactivated',
      APPLICATION_ACTIVATED: 'Application activated',
      SUBSCRIPTION_CREATED: 'Subscription created',
      SUBSCRIPTION_UPDATED: 'Subscription updated',
      SUBSCRIPTION_EXPIRED: 'Subscription expired and inactivated',
      SUBSCRIPTION_EXPIRY_WARNING: 'Subscription expiry warning emailed',
      ENTITLEMENT_CREATED: 'Entitlement granted',
      ENTITLEMENT_UPDATED: 'Entitlement updated',
      TENANT_CREATED: 'Tenant created',
      TENANT_ACTIVATED: 'Tenant approved and activated',
      TENANT_SUSPENDED: 'Tenant suspended',
      SMTP_UPDATED: 'SMTP settings updated',
      OAUTH_CLIENT_CREATED: 'OAuth client created',
      OAUTH_TOKEN_ISSUED: 'OAuth token issued',
    };
    if (map[action]) return map[action];
    const target = entityType ? ` (${entityType})` : '';
    return `${action.replaceAll('_', ' ').toLowerCase()}${target}`;
  }
}
