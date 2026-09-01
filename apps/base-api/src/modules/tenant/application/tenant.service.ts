import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { paginatedResponse } from '@app/common';
import type { ITenantRepository } from '../domain/tenant.repository.interface.js';
import {
  INSTITUTION_PROFILE_REPOSITORY,
  TENANT_CONFIGURATION_REPOSITORY,
  TENANT_CONTACT_REPOSITORY,
  TENANT_REPOSITORY,
} from '../domain/tenant.repository.interface.js';
import type {
  IInstitutionProfileRepository,
  ITenantConfigurationRepository,
  ITenantContactRepository,
} from '../domain/tenant.repository.interface.js';
import { TenantStatus, type TenantProps } from '../domain/tenant.types.js';
import {
  CreateTenantDto,
  OnboardTenantDto,
  UpdateTenantDto,
} from './dto/request/tenant.request.dto.js';
import {
  OnboardTenantResponseDto,
  TenantListResponseDto,
  TenantResponseDto,
} from './dto/response/tenant.response.dto.js';
import {
  toContactResponse,
  toInstitutionProfileResponse,
  toConfigurationResponse,
  toTenantResponse,
} from './mappers/tenant.mapper.js';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    @Inject(INSTITUTION_PROFILE_REPOSITORY)
    private readonly institutionProfileRepository: IInstitutionProfileRepository,
    @Inject(TENANT_CONFIGURATION_REPOSITORY)
    private readonly configurationRepository: ITenantConfigurationRepository,
    @Inject(TENANT_CONTACT_REPOSITORY)
    private readonly contactRepository: ITenantContactRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const existing = await this.tenantRepository.findByCode(dto.tenantCode);
    if (existing) {
      throw new ConflictException(`Tenant code '${dto.tenantCode}' already exists`);
    }
    const tenant = await this.tenantRepository.create({ ...dto, status: TenantStatus.ONBOARDING });
    return toTenantResponse(tenant);
  }

  async onboard(dto: OnboardTenantDto): Promise<OnboardTenantResponseDto> {
    return this.dataSource.transaction(async () => {
      const tenant = await this.create(dto.tenant);
      const institutionProfile = toInstitutionProfileResponse(
        await this.institutionProfileRepository.create({
          ...dto.institutionProfile,
          tenantId: tenant.id,
        }),
      );

      let configuration;
      if (dto.configuration) {
        configuration = toConfigurationResponse(
          await this.configurationRepository.create({
            ...dto.configuration,
            tenantId: tenant.id,
          }),
        );
      }

      let contacts;
      if (dto.contacts?.length) {
        contacts = await Promise.all(
          dto.contacts.map(async (contact) =>
            toContactResponse(
              await this.contactRepository.create({ ...contact, tenantId: tenant.id }),
            ),
          ),
        );
      }

      return { tenant, institutionProfile, configuration, contacts };
    });
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

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantRepository.delete(id);
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
}
