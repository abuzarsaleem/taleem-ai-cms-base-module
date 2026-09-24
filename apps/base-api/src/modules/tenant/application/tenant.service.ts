import {
  ConflictException,
  Inject,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DATABASE_SCHEMA, paginatedResponse } from '@app/common';
import { EntitlementPolicyService } from '../../subscription/application/entitlement-policy.service.js';
import {
  TENANT_ENTITLEMENT_REPOSITORY,
  type ITenantEntitlementRepository,
} from '../../subscription/domain/subscription.repository.interface.js';
import {
  FILE_STORAGE,
  type IFileStorageService,
} from '../../storage/domain/storage.service.interface.js';
import type { ITenantRepository } from '../domain/tenant.repository.interface.js';
import { TENANT_REPOSITORY } from '../domain/tenant.repository.interface.js';
import { TenantStatus, type TenantProps } from '../domain/tenant.types.js';
import { CreateTenantDto, UpdateTenantDto } from './dto/request/tenant.request.dto.js';
import type {
  TenantCatalogueStatsDto,
  TenantListResponseDto,
  TenantResponseDto,
} from './dto/response/tenant.response.dto.js';
import { toTenantResponse } from './mappers/tenant.mapper.js';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    @Inject(TENANT_ENTITLEMENT_REPOSITORY)
    private readonly entitlements: ITenantEntitlementRepository,
    private readonly entitlementPolicy: EntitlementPolicyService,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorageService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const tenantCode = await this.resolveTenantCode(dto);
    const tenant = await this.tenantRepository.create({
      ...dto,
      tenantCode,
      status: TenantStatus.ONBOARDING,
    });
    return toTenantResponse(tenant, 0);
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      status?: string;
      deploymentModel?: string;
      tenantCode?: string;
      search?: string;
      institutionType?: string;
      countryCode?: string;
      city?: string;
    },
  ): Promise<TenantListResponseDto> {
    const [{ data, total }, stats] = await Promise.all([
      this.tenantRepository.findAll(page, limit, filters),
      this.getCatalogueStats(),
    ]);

    const tenantIds = data.map((row) => row.id!).filter(Boolean);
    const [applicationCounts, logoByTenantId] = await Promise.all([
      this.entitlements.countDistinctApplicationsByTenantIds(tenantIds),
      this.resolveLogoUrlsByTenantIds(tenantIds),
    ]);

    return {
      ...paginatedResponse(
        data.map((row) => {
          const logos = logoByTenantId.get(row.id!);
          return {
            ...toTenantResponse(row, applicationCounts.get(row.id!) ?? 0),
            logoUrl: logos?.logoUrl,
            logoDarkUrl: logos?.logoDarkUrl,
          };
        }),
        total,
        page,
        limit,
      ),
      stats,
    };
  }

  async findById(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) throw new NotFoundException(`Tenant '${id}' not found`);
    const [applications, logoByTenantId] = await Promise.all([
      this.entitlementPolicy.listAvailable(id),
      this.resolveLogoUrlsByTenantIds([id]),
    ]);
    const logos = logoByTenantId.get(id);
    return {
      ...toTenantResponse(tenant, applications.length),
      logoUrl: logos?.logoUrl,
      logoDarkUrl: logos?.logoDarkUrl,
      applications,
    };
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    await this.requireTenant(id);
    const updates: Partial<TenantProps> = { ...dto };
    if (dto.status === TenantStatus.ACTIVE) updates.activatedAt = new Date();
    if (dto.status === TenantStatus.SUSPENDED) updates.suspendedAt = new Date();
    if (dto.status === TenantStatus.RETIRED) updates.retiredAt = new Date();
    const updated = await this.tenantRepository.update(id, updates);
    const [applicationCounts, logoByTenantId] = await Promise.all([
      this.entitlements.countDistinctApplicationsByTenantIds([id]),
      this.resolveLogoUrlsByTenantIds([id]),
    ]);
    const logos = logoByTenantId.get(id);
    return {
      ...toTenantResponse(updated, applicationCounts.get(id) ?? 0),
      logoUrl: logos?.logoUrl,
      logoDarkUrl: logos?.logoDarkUrl,
    };
  }

  async delete(_id: string): Promise<void> {
    throw new MethodNotAllowedException(
      'Tenants cannot be deleted. Use suspend or retire instead.',
    );
  }

  async activate(id: string): Promise<TenantResponseDto> {
    return this.update(id, { status: TenantStatus.ACTIVE });
  }

  async suspend(id: string): Promise<TenantResponseDto> {
    return this.update(id, { status: TenantStatus.SUSPENDED });
  }

  async retire(id: string): Promise<TenantResponseDto> {
    return this.update(id, { status: TenantStatus.RETIRED });
  }

  async resolveLogoUrlsByTenantIds(
    tenantIds: string[],
  ): Promise<Map<string, { logoUrl?: string; logoDarkUrl?: string }>> {
    const result = new Map<string, { logoUrl?: string; logoDarkUrl?: string }>();
    if (!tenantIds.length) return result;

    const placeholders = tenantIds.map((_, index) => `$${index + 1}`).join(', ');
    const rows: Array<{
      tenantId: string;
      legacyLogoUrl: string | null;
      lightFileUrl: string | null;
      darkFileUrl: string | null;
    }> = await this.dataSource.query(
      `
      SELECT
        cfg.tenant_id AS "tenantId",
        cfg.logo_url AS "legacyLogoUrl",
        light.file_url AS "lightFileUrl",
        dark.file_url AS "darkFileUrl"
      FROM "${DATABASE_SCHEMA}".tenant_configurations cfg
      LEFT JOIN "${DATABASE_SCHEMA}".tenant_assets light
        ON light.id = cfg.logo_asset_id
      LEFT JOIN "${DATABASE_SCHEMA}".tenant_assets dark
        ON dark.id = cfg.logo_dark_asset_id
      WHERE cfg.tenant_id IN (${placeholders})
      `,
      tenantIds,
    );

    await Promise.all(
      rows.map(async (row) => {
        const lightStored = row.lightFileUrl ?? row.legacyLogoUrl ?? undefined;
        const darkStored = row.darkFileUrl ?? undefined;
        result.set(row.tenantId, {
          logoUrl: lightStored ? await this.storage.resolveUrl(lightStored) : undefined,
          logoDarkUrl: darkStored ? await this.storage.resolveUrl(darkStored) : undefined,
        });
      }),
    );

    return result;
  }

  private async requireTenant(id: string) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) throw new NotFoundException(`Tenant '${id}' not found`);
    return tenant;
  }

  async getCatalogueStats(): Promise<TenantCatalogueStatsDto> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [current, previous] = await Promise.all([
      this.tenantRepository.countByStatus(),
      this.tenantRepository.countCreatedBefore(startOfMonth),
    ]);

    return {
      total: current.total,
      active: current.active,
      onboarding: current.onboarding,
      suspended: current.suspended,
      retired: current.retired,
      vsPreviousMonth: {
        total: current.total - previous.total,
        active: current.active - previous.active,
        onboarding: current.onboarding - previous.onboarding,
        suspended: current.suspended - previous.suspended,
        retired: current.retired - previous.retired,
      },
    };
  }

  private async resolveTenantCode(dto: CreateTenantDto): Promise<string> {
    if (dto.tenantCode?.trim()) {
      const code = this.normalizeCode(dto.tenantCode);
      const existing = await this.tenantRepository.findByCode(code);
      if (existing) {
        throw new ConflictException(`Tenant code '${code}' already exists`);
      }
      return code;
    }

    const base = this.slugify(dto.displayName || dto.legalName).slice(0, 40) || 'tenant';
    let candidate = base;
    let suffix = 0;
    while (await this.tenantRepository.findByCode(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`.slice(0, 50);
    }
    return candidate;
  }

  private normalizeCode(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '-');
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
