import {
  ConflictException,
  Inject,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { paginatedResponse } from '@app/common';
import type { ITenantRepository } from '../domain/tenant.repository.interface.js';
import { TENANT_REPOSITORY } from '../domain/tenant.repository.interface.js';
import { TenantStatus, type TenantProps } from '../domain/tenant.types.js';
import { CreateTenantDto, UpdateTenantDto } from './dto/request/tenant.request.dto.js';
import {
  TenantListResponseDto,
  TenantResponseDto,
} from './dto/response/tenant.response.dto.js';
import { toTenantResponse } from './mappers/tenant.mapper.js';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const tenantCode = await this.resolveTenantCode(dto);
    const tenant = await this.tenantRepository.create({
      ...dto,
      tenantCode,
      status: TenantStatus.ONBOARDING,
    });
    return toTenantResponse(tenant);
  }

  async findAll(page = 1, limit = 20): Promise<TenantListResponseDto> {
    const { data, total } = await this.tenantRepository.findAll(page, limit);
    return paginatedResponse(data.map(toTenantResponse), total, page, limit);
  }

  async findById(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) throw new NotFoundException(`Tenant '${id}' not found`);
    return toTenantResponse(tenant);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    await this.findById(id);
    const updates: Partial<TenantProps> = { ...dto };
    if (dto.status === TenantStatus.ACTIVE) updates.activatedAt = new Date();
    if (dto.status === TenantStatus.SUSPENDED) updates.suspendedAt = new Date();
    if (dto.status === TenantStatus.RETIRED) updates.retiredAt = new Date();
    return toTenantResponse(await this.tenantRepository.update(id, updates));
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
