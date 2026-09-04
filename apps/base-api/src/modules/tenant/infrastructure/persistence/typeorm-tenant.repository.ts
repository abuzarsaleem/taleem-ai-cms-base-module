import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ITenantRepository } from '../../domain/tenant.repository.interface.js';
import type { TenantProps } from '../../domain/tenant.types.js';
import { TenantEntity } from './tenant.entity.js';

@Injectable()
export class TypeOrmTenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
  ) {}

  async findById(id: string): Promise<TenantProps | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(tenantCode: string): Promise<TenantProps | null> {
    const entity = await this.repository.findOne({ where: { tenantCode } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    page: number,
    limit: number,
    filters?: {
      status?: string;
      deploymentModel?: string;
      tenantCode?: string;
      search?: string;
      institutionType?: string;
      countryCode?: string;
      city?: string;
    },
  ) {
    const qb = this.repository.createQueryBuilder('t').orderBy('t.created_at', 'DESC');
    if (filters?.status) qb.andWhere('t.status = :status', { status: filters.status });
    if (filters?.deploymentModel) {
      qb.andWhere('t.deployment_model = :deploymentModel', {
        deploymentModel: filters.deploymentModel,
      });
    }
    if (filters?.tenantCode) {
      qb.andWhere('LOWER(t.tenant_code) LIKE :tenantCode', {
        tenantCode: `%${filters.tenantCode.toLowerCase()}%`,
      });
    }
    if (filters?.search) {
      qb.andWhere(
        `(LOWER(t.tenant_code) LIKE :search OR LOWER(t.legal_name) LIKE :search OR LOWER(t.display_name) LIKE :search)`,
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }
    if (filters?.institutionType) {
      qb.andWhere('UPPER(t.institution_type) = :institutionType', {
        institutionType: filters.institutionType.toUpperCase(),
      });
    }
    if (filters?.countryCode) {
      qb.andWhere('UPPER(t.country_code) = :countryCode', {
        countryCode: filters.countryCode.toUpperCase(),
      });
    }
    if (filters?.city) {
      qb.andWhere('LOWER(t.city) LIKE :city', { city: `%${filters.city.toLowerCase()}%` });
    }

    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  async create(props: TenantProps): Promise<TenantProps> {
    const saved = await this.repository.save(this.repository.create(props));
    return this.toDomain(saved);
  }

  async update(id: string, props: Partial<TenantProps>): Promise<TenantProps> {
    await this.repository.update(id, props);
    return this.toDomain(await this.repository.findOneOrFail({ where: { id } }));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toDomain(entity: TenantEntity): TenantProps {
    return {
      id: entity.id,
      tenantCode: entity.tenantCode,
      legalName: entity.legalName,
      displayName: entity.displayName,
      institutionType: entity.institutionType,
      websiteUrl: entity.websiteUrl,
      status: entity.status,
      deploymentModel: entity.deploymentModel,
      countryCode: entity.countryCode,
      provinceCode: entity.provinceCode,
      city: entity.city,
      activatedAt: entity.activatedAt,
      suspendedAt: entity.suspendedAt,
      retiredAt: entity.retiredAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
