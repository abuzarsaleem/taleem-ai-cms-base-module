import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CatalogItemProps,
  ICatalogRepository,
} from '../../domain/tenant.repository.interface.js';
import {
  DepartmentEntity,
  DesignationEntity,
  IdentifierTypeEntity,
} from './tenant-sub-resource.entities.js';

function mapCatalog(e: {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}): CatalogItemProps {
  return {
    id: e.id,
    code: e.code,
    name: e.name,
    description: e.description,
    isActive: e.isActive,
    createdAt: e.createdAt,
  };
}

@Injectable()
export class TypeOrmDepartmentRepository implements ICatalogRepository {
  constructor(
    @InjectRepository(DepartmentEntity) private readonly repo: Repository<DepartmentEntity>,
  ) {}

  async findActive() {
    const rows = await this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return rows.map(mapCatalog);
  }

  async findActiveByCode(code: string) {
    const row = await this.repo.findOne({ where: { code: code.toUpperCase(), isActive: true } });
    return row ? mapCatalog(row) : null;
  }
}

@Injectable()
export class TypeOrmDesignationRepository implements ICatalogRepository {
  constructor(
    @InjectRepository(DesignationEntity) private readonly repo: Repository<DesignationEntity>,
  ) {}

  async findActive() {
    const rows = await this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return rows.map(mapCatalog);
  }

  async findActiveByCode(code: string) {
    const row = await this.repo.findOne({ where: { code: code.toUpperCase(), isActive: true } });
    return row ? mapCatalog(row) : null;
  }
}

@Injectable()
export class TypeOrmIdentifierTypeRepository implements ICatalogRepository {
  constructor(
    @InjectRepository(IdentifierTypeEntity)
    private readonly repo: Repository<IdentifierTypeEntity>,
  ) {}

  async findActive() {
    const rows = await this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return rows.map(mapCatalog);
  }

  async findActiveByCode(code: string) {
    const row = await this.repo.findOne({ where: { code: code.toUpperCase(), isActive: true } });
    return row ? mapCatalog(row) : null;
  }
}
