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

  async findAll(page: number, limit: number) {
    const [entities, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
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
