import {
  ConflictException,
  Inject,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import { EntitlementPolicyService } from '../../subscription/application/entitlement-policy.service.js';
import {
  TENANT_ENTITLEMENT_REPOSITORY,
  type ITenantEntitlementRepository,
} from '../../subscription/domain/subscription.repository.interface.js';
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

    const applicationCounts = await this.entitlements.countDistinctApplicationsByTenantIds(
      data.map((row) => row.id!).filter(Boolean),
    );

    return {
      ...paginatedResponse(
        data.map((row) => toTenantResponse(row, applicationCounts.get(row.id!) ?? 0)),
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
    const applications = await this.entitlementPolicy.listAvailable(id);
    return {
      ...toTenantResponse(tenant, applications.length),
      applications,
    };
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    const existing = await this.requireTenant(id);
    const updates: Partial<TenantProps> = { ...dto };
    if (dto.status === TenantStatus.ACTIVE) updates.activatedAt = new Date();
    if (dto.status === TenantStatus.SUSPENDED) updates.suspendedAt = new Date();
    if (dto.status === TenantStatus.RETIRED) updates.retiredAt = new Date();
    const updated = await this.tenantRepository.update(id, updates);
    const applicationCounts = await this.entitlements.countDistinctApplicationsByTenantIds([id]);
    return toTenantResponse(updated, applicationCounts.get(id) ?? 0);
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
